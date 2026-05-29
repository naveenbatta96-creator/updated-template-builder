sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, History, MessageBox, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("com.template.builder.controller.ObjectPage", {

        onInit: function () {
            // 1. Get the router
            var oRouter = this.getOwnerComponent().getRouter();
            
            // 2. Attach a function to run every time this route is hit
            oRouter.getRoute("RouteObjectPage").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            // 1. Extract the ID from the URL (from the parameter we defined in manifest.json)
            var sTemplateId = oEvent.getParameter("arguments").templateId;

            // 2. Construct the OData V4 Path for this specific record
            // Example: /TemplateMaster(ID='1234-5678-uuid') or however your CAPM sets the key
            var sPath = "/TemplateMaster(" + sTemplateId + ")"; 

            // 3. Bind the View to this specific record
            // We use standard OData V4 context binding
            this.getView().bindElement({
                path: sPath,
                parameters: {
                    // Tell CAPM to expand the navigation property so the Table loads data!
                    $expand: "mappings" 
                }
            });
        },

        // Handy back-navigation function
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteHome", {}, true);
            }
        },

        onEdit: async function () {
            try {
                if (!this.oEditDialog) {
                    this.oEditDialog = await Fragment.load({
                        id: this.getView().getId(),
                        name: "com.template.builder.fragment.EditTemplateDialog",
                        controller: this
                    });
                    this.getView().addDependent(this.oEditDialog);
                }
                this.oEditDialog.open();
            } catch (error) {
                console.error("Fragment Load Error:", error);
                MessageToast.show("Error loading edit dialog");
            }
        },

        onSaveEdit: function () {
            var sTemplateName = Fragment.byId(this.getView().getId(), "editTemplateNameInput").getValue();
            if (!sTemplateName || !sTemplateName.trim()) {
                MessageToast.show("Please enter a template name.");
                return;
            }
            if (this.oEditDialog) {
                this.oEditDialog.close();
                MessageToast.show("Template details updated successfully.");
            }
        },

        onCloseEditDialog: function () {
            if (this.oEditDialog) {
                this.oEditDialog.close();
                this.getView().getModel().resetChanges();
            }
        },

        onDelete: function () {
            var oContext = this.getView().getBindingContext();
            if (!oContext) return;

            MessageBox.confirm("Are you sure you want to delete this template?", {
                title: "Confirm Deletion",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        sap.ui.core.BusyIndicator.show(0);
                        oContext.delete().then(function () {
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show("Template deleted successfully.");
                            this.onNavBack();
                        }.bind(this)).catch(function (oError) {
                            sap.ui.core.BusyIndicator.hide();
                            console.error("Delete Error:", oError);
                            MessageToast.show("Error deleting template.");
                        });
                    }
                }.bind(this)
            });
        },

        onDeleteMapping: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var oContext = oItem.getBindingContext();
            if (!oContext) return;

            MessageBox.confirm("Are you sure you want to remove this field mapping?", {
                title: "Confirm Removal",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        sap.ui.core.BusyIndicator.show(0);
                        oContext.delete().then(function () {
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show("Field mapping removed.");
                        }).catch(function (oError) {
                            sap.ui.core.BusyIndicator.hide();
                            console.error("Delete Mapping Error:", oError);
                            MessageToast.show("Error removing field mapping.");
                        });
                    }
                }.bind(this)
            });
        }
    });
});