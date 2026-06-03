sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/FlexBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"

], function (MessageToast, Dialog, Button, Input, Label, VBox, FlexBox, Fragment, MessageBox) {
    'use strict';

    var CreateTemplateDialog = {
        /**
         * Generated event handler.
         */
        createTemplate: function () {
            MessageToast.show("Custom handler invoked.");

            // 1. NATIVE EXTENSION VIEW RETRIEVAL:
            // "this" is bound to the controller instance when registered properly
            var oView = null;
            if (this && typeof this.getView === "function") {
                oView = this.getView();

            } else if (this && this.base && typeof this.base.getView === "function") {
                oView = this.base.getView();
            }

            // 2. ULTIMATE GLOBAL FALLBACK: If "this" is still sandboxed, find the active view component via ID lookup
            if (!oView) {
                // Finds the active ListReport view component using your application ID prefix
                oView = sap.ui.getCore().byId("nav.tmp.map.templatemap::TemplateMasterWithCountList");
            }

            // 3. Fallback to active UI components if ID mapping differs
            if (!oView) {
                var oComponent = sap.ui.core.Component.getOwnerComponentFor(this);
                if (oComponent && typeof oComponent.getRootControl === "function") {
                    oView = oComponent.getRootControl();
                }
            }

            // 4. Panic Check
            if (!oView) {
                MessageBox.error("Fiori Elements View Context could not be deduced via standard extension mapping.");
                return;
            }

            CreateTemplateDialog._oView = oView;
            CreateTemplateDialog._oExtensionAPI = this;

            // 5. Lazy Dialog instantiation attached to global module context
            if (!CreateTemplateDialog._pDialog) {
                CreateTemplateDialog._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "nav.tmp.map.templatemap.ext.CreateTemplateDialog",
                    controller: CreateTemplateDialog
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                }).catch(function (oErr) {
                    MessageBox.error("Failed to load fragment file: " + oErr.message);
                });
            }

            CreateTemplateDialog._pDialog.then(function (oDialog) {
                if (oDialog) {
                    oDialog.open();
                }
            });
        },

        onCloseDialog: function () {
            if (CreateTemplateDialog._pDialog) {
                CreateTemplateDialog._pDialog.then(function (oDialog) {
                    if (oDialog) oDialog.close();
                });
            }
        },

        onTableSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var aSelectedContexts = oTable.getSelectedContexts();
            var oView = CreateTemplateDialog._oView;
            if (oView) {
                var oCountText = oView.byId("selectedFieldsCount");
                if (oCountText) {
                    oCountText.setText(aSelectedContexts.length + " field(s) selected");
                }
            }
        },

        /**
         * OData V4 Compliant Action Save Handler
         */
        onSaveTemplate: function (oEvent) {
            var oView = CreateTemplateDialog._oView;
            if (!oView) {
                MessageBox.error("View context not available.");
                return;
            }
            var oModel = oView.getModel();

            // 1. Get chosen fields from the fragment's selection table
            var oTable = oView.byId("fieldsTable");
            if (!oTable) {
                MessageBox.error("Could not find fields selection table instance.");
                return;
            }

            var aSelectedContexts = oTable.getSelectedContexts();
            if (aSelectedContexts.length === 0) {
                MessageToast.show("Please select at least one field for the template.");
                return;
            }

            // 2. Extract your input/select values from your Step 2 Form
            var oNameInput = oView.byId("inputTemplateName");
            var oTypeSelect = oView.byId("selectTemplateType");

            var sTemplateName = oNameInput ? oNameInput.getValue() : "";
            var sTemplateType = oTypeSelect ? oTypeSelect.getSelectedKey() : "";

            if (!sTemplateName.trim()) {
                if (oNameInput) {
                    oNameInput.setValueState("Error");
                    oNameInput.setValueStateText("Template Name is required.");
                }
                return;
            }

            oView.setBusy(true);

            // 3. Bind to OData V4 unbound action
            var oActionBinding = oModel.bindContext("/createTemplateWithFields(...)");

            oActionBinding.setParameter("templateName", sTemplateName);
            oActionBinding.setParameter("templateType", sTemplateType);
            oActionBinding.setParameter("chosenFields", aSelectedContexts.map(function (oSelContext) {
                var oField = oSelContext.getObject();
                return {
                    fieldID: oField.ID,
                    level: oField.levelName || "",
                    fieldDescription: oField.fieldName || "",
                    propertyType: oField.propertyType || "Optional",
                    maxLength: oField.fieldLength ? parseInt(oField.fieldLength, 10) : 0
                };
            }));

            oActionBinding.invoke().then(function () {
                oView.setBusy(false);
                MessageToast.show("Template created and saved successfully!");

                if (oNameInput) oNameInput.setValueState("None");
                CreateTemplateDialog.onCloseDialog();

                // Refresh the table using Fiori Elements Extension API
                var oExtensionAPI = CreateTemplateDialog._oExtensionAPI;
                if (oExtensionAPI && oExtensionAPI.editFlow) {
                    oExtensionAPI.refresh();
                } else {
                    // Fallback to table binding refresh
                    oView.findAggregatedObjects(true, function (oControl) {
                        if (oControl.isA("sap.ui.table.Table") || oControl.isA("sap.m.Table") || oControl.isA("sap.ui.mdc.Table")) {
                            var oBinding = oControl.getBinding("items") || oControl.getBinding("rows");
                            if (oBinding) {
                                oBinding.refresh();
                            }
                        }
                    });
                }
            }).catch(function (oError) {
                oView.setBusy(false);
                MessageBox.error("Failed to save template: " + oError.message);
            });
        }
    };

    return CreateTemplateDialog;
});