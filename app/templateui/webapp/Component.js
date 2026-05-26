sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("com.template.builder.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // Create the model
            const oModel = new JSONModel({
                templates: []
            });

            // Set model on component (view will inherit it)
            this.setModel(oModel, "templateModel");

            // Initialize router after component setup
            this.getRouter().initialize();
        }
    });
});