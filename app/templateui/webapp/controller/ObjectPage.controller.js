sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
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
        }
    });
});