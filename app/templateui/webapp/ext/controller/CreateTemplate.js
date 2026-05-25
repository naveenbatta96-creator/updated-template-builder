// // sap.ui.define([
// //     "sap/m/MessageToast"
// // ], function(MessageToast) {
// //     'use strict';

// // const { type } = require("@sap/cds");

// //     return {
// //         /**
// //          * Generated event handler.
// //          *
// //          * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
// //          * @param aSelectedContexts the selected contexts of the table rows.
// //          */
// //         createTemplate: function(oContext, aSelectedContexts) {
// //             MessageToast.show("Custom handler invoked.");
// //         }
// //     };
// // });
// sap.ui.loader.config({
//     paths: {
//         // This climbs up one level out of "controller" back into "ext"
//         "com/template/builder/nats/templateui": "../"
//     }
// });

// sap.ui.define([
//     "sap/ui/core/Fragment",
//     "sap/m/MessageToast"
// ], function(Fragment, MessageToast) {
//     'use strict';

//     let oDialog;

//     return {
//         createTemplate: function(oEvent) {
//             console.log("Button clicked!");

//             if (!oDialog) {
//                 Fragment.load({
//                     // Now UI5 maps this perfectly to webapp/ext/fragment/...
//                     name: "com.template.builder.nats.templateui.ext.fragment.CreateTemplate",
//                     controller: this
//                 }).then((oLoadedDialog) => {
//                     oDialog = oLoadedDialog;
//                     oDialog.open();
//                     MessageToast.show("Dialog opened!");
//                 }).catch((oError) => {
//                     console.error("Fragment loading failed details:", oError);
//                     MessageToast.show("Failed to open dialog");
//                 });
//             } else {
//                 oDialog.open();
//             }
//         },

//         onCloseDialog: function() {
//             if (oDialog) {
//                 oDialog.close();
//             }
//         },

//         onSaveDialog: function() {
//             MessageToast.show("Template created!");
//             if (oDialog) {
//                 oDialog.close();
//             }
//         }
//     };
// });

sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension", // Required for flat extension file imports in Fiori V4
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet"
], function(ControllerExtension, Fragment, MessageToast, Spreadsheet) {
    'use strict';

    let oDialog;

    return ControllerExtension.extend("com.template.builder.nats.templateui.ext.controller.CreateTemplate", {
        // public extension methods container mapping
        override: {
            // Standard lifecycle overrides can go here if needed
        },

        createTemplate: function(oEvent) {
            // "this" in an extended class references the core extension instance context
            var oView = this.getView(); // In standard extensions, you use this.getView() natively!
            var sFragmentPath = "com.template.builder.nats.templateui.ext.fragment.CreateTemplate";

            if (!oDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: sFragmentPath, 
                    controller: this
                }).then((oLoadedDialog) => {
                    oDialog = oLoadedDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();
                }).catch((oError) => {
                    console.error("Fragment loader crashed:", oError);
                    MessageToast.show("Error loading layout fragment configuration.");
                });
            } else {
                oDialog.open();
            }
        },

        onExecuteExport: function() {
            var oView = this.getView();
            
            var aHeaderFields  = oView.byId("headerFieldsList").getSelectedItems().map(item => item.getDescription());
            var aItemFields    = oView.byId("itemFieldsList").getSelectedItems().map(item => item.getDescription());
            var aPaymentFields = oView.byId("paymentFieldsList").getSelectedItems().map(item => item.getDescription());
            var sDownloadMode  = oView.byId("downloadModeBtn").getSelectedKey();

            var aAllSelectedColumns = [].concat(aHeaderFields, aItemFields, aPaymentFields);
            
            if (aAllSelectedColumns.length === 0) {
                MessageToast.show("Please map at least one field before executing download.");
                return;
            }

            var oTableControl = oView.findAggregatedObjects(false, function(c) {
                return c.isA("sap.ui.mdc.Table") || c.isA("sap.ui.comp.smarttable.SmartTable") || c.isA("sap.m.Table");
            })[0];

            if (!oTableControl) {
                MessageToast.show("Could not establish table context layer.");
                return;
            }

            var oRowBinding = oTableControl.getBinding("rows") || oTableControl.getBinding("items");
            
            var fnBuildWorkbookColumns = function(aFields) {
                return aFields.map(sField => {
                    return { label: sField.toUpperCase(), property: sField, type: 'string' };
                });
            };

            var oSettings;

            if (sDownloadMode === "SINGLE") {
                oSettings = {
                    workbook: { columns: fnBuildWorkbookColumns(aAllSelectedColumns) },
                    dataSource: oRowBinding,
                    fileName: "Lockbox_Template_Flat.xlsx"
                };
                new Spreadsheet(oSettings).build().then(() => MessageToast.show("Flat workbook downloaded!"));
            } else {
                oSettings = {
                    workbook: {
                        worksheets: [
                            { name: "Header Level Data", columns: fnBuildWorkbookColumns(aHeaderFields) },
                            { name: "Item Level Data", columns: fnBuildWorkbookColumns(aItemFields) },
                            { name: "Payment Level Data", columns: fnBuildWorkbookColumns(aPaymentFields) }
                        ]
                    },
                    dataSource: oRowBinding,
                    fileName: "Lockbox_Template_Split.xlsx"
                };
                new Spreadsheet(oSettings).build().then(() => MessageToast.show("Split leveled workbooks downloaded!"));
            }

            this.onCloseDialog();
        },

        onCloseDialog: function() {
            if (oDialog) {
                oDialog.close();
            }
        }
    });
});  