sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Fragment, MessageToast, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.lockbox.templatebuilder.controller.Home", {

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

                // 1. GET SELECTED FIELDS WITH SQLite IDs
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
                        field_ID: oField.ID,       // CAPM automatically maps associations to Entity_ID
                        sequenceNo: index + 1      // Sequential ordering
                    };
                });

                const oTemplatePayload = {
                    templateName: sTemplateName,
                    templateType: sTemplateType,
                    sheetMode: sSheetMode,
                    status: "ACTIVE",
                    mappings: aMappingsPayload     // Composition navigation property name from schema.cds
                };

                console.log("OData V4 Deep Insert Payload:", oTemplatePayload);

                // 3. TARGET DEFAULT ODATA V4 MODEL
                const oODataModel = this.getView().getModel(); 
                
                // 4. BIND LIST TO THE ENTITY SET
                const oListBinding = oODataModel.bindList("/TemplateMaster");

                sap.ui.core.BusyIndicator.show(0);

                // 5. EXECUTE THE V4 CREATE OPERATION
                const oNewContext = oListBinding.create(oTemplatePayload);

                // 6. ODATA V4 PROMISE HANDLING FOR DATABASE PERSISTENCE
                oNewContext.created().then(function () {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Template saved persistently to SQLite via CAPM!");
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

            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext(); 
                
                if (oContext) {
                    var oData = oContext.getObject();
                    aFields.push({
                        ID: oData.ID, // Extracting the SQLite UUID primary key
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
            const oContext = oItem.getBindingContext(); // Grab the V4 Context directly
            
            if (!oContext) return;

            sap.ui.core.BusyIndicator.show(0);

            // 💡 V4 Standard: Call .delete() straight on the binding context returning a Promise
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
        }

    });
});