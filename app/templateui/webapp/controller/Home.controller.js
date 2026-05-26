sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
        "sap/ui/model/json/JSONModel"

], function (Controller, Fragment, MessageToast, JSONModel) {
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

            Fragment.byId(
                this.getView().getId(),
                "templateNameInput"
            ).setValue("");

            Fragment.byId(
                this.getView().getId(),
                "templateTypeSelect"
            ).setSelectedKey("LOCKBOX");

            Fragment.byId(
                this.getView().getId(),
                "sheetModeSegment"
            ).setSelectedKey("SINGLE");
        },

        onCloseDialog: function () {

            if (this.oCreateDialog) {
                this.oCreateDialog.close();
            }
        },

        onSaveTemplate: function () {

    try {

        const sTemplateName = Fragment.byId(
            this.getView().getId(),
            "templateNameInput"
        ).getValue();

        const sTemplateType = Fragment.byId(
            this.getView().getId(),
            "templateTypeSelect"
        ).getSelectedKey();

        const sSheetMode = Fragment.byId(
            this.getView().getId(),
            "sheetModeSegment"
        ).getSelectedKey();

        // Validation
        if (!sTemplateName || !sTemplateName.trim()) {

            MessageToast.show("Please enter template name");

            return;
        }

        // Create object
        const oTemplateData = {
            name: sTemplateName,
            type: sTemplateType,
            sheetMode: sSheetMode,
            createdAt: new Date()
        };

        console.log("Template Data:", oTemplateData);

        // Get model
        const oModel = this.getView().getModel("templateModel");

        // Get existing array
        const aTemplates = oModel.getProperty("/templates");

        // Add new object
        aTemplates.push(oTemplateData);

        // Update model
        oModel.setProperty("/templates", aTemplates);

        // Debug
        console.log("Updated Model:", oModel.getData());

        // Success message
        MessageToast.show("Template saved successfully");

        // Close dialog
        this.onCloseDialog();

    } catch (error) {

        console.error("Save Error:", error);

        MessageToast.show("Error saving template");
    }
},
        onDeleteTemplate: function (oEvent) {

    const oItem = oEvent.getSource().getParent();

    const oContext = oItem.getBindingContext("templateModel");

    const sPath = oContext.getPath();

    const iIndex = parseInt(sPath.split("/")[2]);

    const oModel = this.getView().getModel("templateModel");

    const aTemplates = oModel.getProperty("/templates");

    aTemplates.splice(iIndex, 1);

    oModel.setProperty("/templates", aTemplates);

    MessageToast.show("Template deleted");
}

    });
});