sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"nav/tmp/map/templatemap/test/integration/pages/TemplateMasterWithCountList",
	"nav/tmp/map/templatemap/test/integration/pages/TemplateMasterWithCountObjectPage",
	"nav/tmp/map/templatemap/test/integration/pages/TemplateFieldMappingObjectPage"
], function (JourneyRunner, TemplateMasterWithCountList, TemplateMasterWithCountObjectPage, TemplateFieldMappingObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('nav/tmp/map/templatemap') + '/test/flp.html#app-preview',
        pages: {
			onTheTemplateMasterWithCountList: TemplateMasterWithCountList,
			onTheTemplateMasterWithCountObjectPage: TemplateMasterWithCountObjectPage,
			onTheTemplateFieldMappingObjectPage: TemplateFieldMappingObjectPage
        },
        async: true
    });

    return runner;
});

