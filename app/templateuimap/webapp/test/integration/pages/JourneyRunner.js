sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"nav/template/builder/templateuimap/test/integration/pages/TemplateMasterList",
	"nav/template/builder/templateuimap/test/integration/pages/TemplateMasterObjectPage",
	"nav/template/builder/templateuimap/test/integration/pages/TemplateFieldMappingObjectPage"
], function (JourneyRunner, TemplateMasterList, TemplateMasterObjectPage, TemplateFieldMappingObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('nav/template/builder/templateuimap') + '/test/flp.html#app-preview',
        pages: {
			onTheTemplateMasterList: TemplateMasterList,
			onTheTemplateMasterObjectPage: TemplateMasterObjectPage,
			onTheTemplateFieldMappingObjectPage: TemplateFieldMappingObjectPage
        },
        async: true
    });

    return runner;
});

