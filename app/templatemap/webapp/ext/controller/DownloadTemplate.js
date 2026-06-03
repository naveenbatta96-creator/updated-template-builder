sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (MessageToast, MessageBox) {
    "use strict";

    var DownloadTemplate = {

        /**
         * Called by Fiori Elements when the inline Download button is pressed.
         * Signature for controlConfiguration actions: (oBindingContext, oExtensionAPI)
         */
        downloadTemplate: function (oBindingContext) {
            console.log("hi");

            if (!oBindingContext) {
                MessageBox.error("No row context available. Please try again.");
                return;
            }

            var oObject = oBindingContext.getObject();
            if (!oObject || !oObject.ID) {
                MessageBox.error("Could not determine the Template ID from the selected row.");
                return;
            }

            var sTemplateName = oObject.templateName || "Template";

            MessageToast.show("Preparing download for: " + sTemplateName);

            var oModel = oBindingContext.getModel();

            // Call the bound action via OData V4 — no parameters (exportMode is determined server-side from sheetMode)
            var oActionBinding = oModel.bindContext(
                "TemplateService.TemplateMasterWithCount_downloadTemplate(...)",
                oBindingContext
            );

            oActionBinding.invoke().then(function () {
                var oResult = oActionBinding.getBoundContext().getObject();

                if (!oResult || !oResult.fileContent) {
                    MessageBox.error("Download failed: No file data received from server.");
                    return;
                }

                // Decode base64 string → binary bytes → Blob
                var sByteChars = atob(oResult.fileContent);
                var aBytes = new Uint8Array(sByteChars.length);
                for (var i = 0; i < sByteChars.length; i++) {
                    aBytes[i] = sByteChars.charCodeAt(i);
                }
                var oBlob = new Blob([aBytes], {
                    type: oResult.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });

                // Trigger browser file download
                var sUrl = URL.createObjectURL(oBlob);
                var oLink = document.createElement("a");
                oLink.href = sUrl;
                oLink.download = oResult.fileName || (sTemplateName + "_Configuration.xlsx");
                document.body.appendChild(oLink);
                oLink.click();
                document.body.removeChild(oLink);
                URL.revokeObjectURL(sUrl);

                MessageToast.show("Downloaded: " + oLink.download);

            }).catch(function (oError) {
                MessageBox.error("Download failed: " + (oError.message || "Unknown error"));
            });
        }
    };

    return DownloadTemplate;
});