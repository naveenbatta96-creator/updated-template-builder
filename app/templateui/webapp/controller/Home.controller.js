sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "xlsx",
    "sap/ui/export/library"

], function (Controller, Fragment, MessageToast, JSONModel, Filter, FilterOperator,Spreadsheet, exportLibrary, XLSX ) {
    "use strict";

    return Controller.extend("com.template.builder.controller.Home", {

        //===================================================================================================
        // Controller Lifecycle Methods
        //===================================================================================================
        onInit: function(){
            // 1. Create a new JSON Model to hold our counter data
            var oCounterModel = new JSONModel({
                selectedCount: 0
            });
            
            // 2. Attach it to the View so your other functions can find it!
            this.getView().setModel(oCounterModel, "counterModel");
        },

        //=====================================================================================================
        // Event Handlers
        //=====================================================================================================
        
        onTableSelectionChange: function(oEvent){
            var oTable = oEvent.getSource();
            var iSelectedcount = oTable.getSelectedItems().length;
            
            // FIXED: Added .getView()
            this.getView().getModel("counterModel").setProperty("/selectedCount", iSelectedcount);
        },

        onCreateTemplate: async function () {
            console.log("Create Template Clicked");
            try {
                if (!this.oCreateDialog) {
                    this.oCreateDialog = await Fragment.load({
                        id: this.getView().getId(),
                        name: "com.template.builder.fragment.CreateTemplateDialog",
                        controller: this
                    });
                    this.getView().addDependent(this.oCreateDialog);
                }
                this._resetDialogFields();
                this.oCreateDialog.open();
            } catch (error) {
                console.error("Fragment Load Error:", error);
                MessageToast.show("Error loading dialog");
            }
        },

        _resetDialogFields: function () {
            Fragment.byId(this.getView().getId(), "templateNameInput").setValue("");
            Fragment.byId(this.getView().getId(), "templateTypeSelect").setSelectedKey("LOCKBOX");
            Fragment.byId(this.getView().getId(), "sheetModeSelect").setSelectedKey("SINGLE");
        },

        onCloseDialog: function () {
            if (this.oCreateDialog) {
                this.oCreateDialog.close();
            }
        },

        onSaveTemplate: function () {
            try {
                const sTemplateName = Fragment.byId(this.getView().getId(), "templateNameInput").getValue();
                const sTemplateType = Fragment.byId(this.getView().getId(), "templateTypeSelect").getSelectedKey();
                const sSheetMode = Fragment.byId(this.getView().getId(), "sheetModeSelect").getSelectedKey();

                // 1. GET SELECTED FIELDS
                const aSelectedFields = this._getSelectedFields();
                console.log("Selected Fields for DB:", aSelectedFields);

                // VALIDATION
                if (!sTemplateName || !sTemplateName.trim()) {
                    MessageToast.show("Please enter template name");
                    return;
                }

                if (aSelectedFields.length === 0) {
                    MessageToast.show("Please select at least one field");
                    return;
                }

                // 2. CONSTRUCT THE DEEP INSERT PAYLOAD FOR CAPM
                const aMappingsPayload = aSelectedFields.map(function (oField, index) {
                    return {
                        field_ID: oField.ID,
                        sequenceNo: index + 1
                    };
                });

                const oTemplatePayload = {
                    templateName: sTemplateName,
                    templateType: sTemplateType,
                    sheetMode: sSheetMode,
                    status: "ACTIVE",
                    mappings: aMappingsPayload
                };

                // 3. TARGET DEFAULT ODATA V4 MODEL
                const oODataModel = this.getView().getModel(); 
                
                // 4. BIND LIST TO THE BASE ENTITY SET (Required for POST)
                const oListBinding = oODataModel.bindList("/TemplateMaster");

                sap.ui.core.BusyIndicator.show(0);

                // 5. EXECUTE THE V4 CREATE OPERATION
                const oNewContext = oListBinding.create(oTemplatePayload);

                // 6. ODATA V4 PROMISE HANDLING
                oNewContext.created().then(function () {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Template saved persistently to SQLite via CAPM!");
                    
                    // NEW: Refresh the table so the backend View recalculates the counts
                    var oTable = this.byId("templateTable");
                    if (oTable && oTable.getBinding("items")) {
                        oTable.getBinding("items").refresh();
                    }

                    this.onCloseDialog();
                }.bind(this)).catch(function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("CAPM Server Save Error:", oError);
                    MessageToast.show("Error writing records to persistent storage.");
                });

            } catch (error) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Save Error Execution:", error);
                MessageToast.show("Error saving template");
            }
        },

        _getSelectedFields: function () {
            var oTable = this.byId("fieldsTable") || Fragment.byId(this.getView().getId(), "fieldsTable");
            var aFields = [];

            if (!oTable) {
                console.error("Table 'fieldsTable' not found in View or Fragment context.");
                return aFields;
            }

            var aSelectedItems = oTable.getSelectedItems();
            
            // FIXED: Added .getView()
            this.getView().getModel("counterModel").setProperty("/selectedCount", aSelectedItems.length);

            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext(); 
                
                if (oContext) {
                    var oData = oContext.getObject();
                    aFields.push({
                        ID: oData.ID,
                        fieldName: oData.fieldName,
                        levelName: oData.levelName,
                        sapType: oData.sapType
                    });
                }
            });

            return aFields;
        },

        onDeleteTemplate: function (oEvent) {
            const oItem = oEvent.getSource().getParent();
            const oContext = oItem.getBindingContext();
            
            if (!oContext) return;

            sap.ui.core.BusyIndicator.show(0);

            oContext.delete().then(function () {
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show("Template deleted from SQLite database.");
            }).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Delete Fail:", oError);
                MessageToast.show("Could not remove template.");
            });
        },

        onLevelFilterChange: function (oEvent) {
            var sKey = oEvent.getSource().getSelectedKey();
            var oTable = this.byId("fieldsTable") || Fragment.byId(this.getView().getId(), "fieldsTable");
            
            if (!oTable) return;

            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;

            var aFilters = [];
            if (sKey !== "ALL") {
                aFilters.push(
                    new Filter("levelName", FilterOperator.EQ, sKey)
                );
            }

            oBinding.filter(aFilters);
        },

        // ==========================================
        // ROW PRESS NAVIGATION
        // ==========================================
        
        onRowPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext(); 
            
            if (!oContext) {
                return;
            }

            var sTemplateId = oContext.getProperty("ID"); 
            var oRouter = this.getOwnerComponent().getRouter();

            oRouter.navTo("RouteObjectPage", {
                templateId: sTemplateId
            });
        }

    });
});