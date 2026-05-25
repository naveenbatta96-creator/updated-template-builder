sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/template/builder/nats/templateui/test/integration/pages/TemplateMasterList",
	"com/template/builder/nats/templateui/test/integration/pages/TemplateMasterObjectPage"
], function (JourneyRunner, TemplateMasterList, TemplateMasterObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/template/builder/nats/templateui') + '/test/flp.html#app-preview',
        pages: {
			onTheTemplateMasterList: TemplateMasterList,
			onTheTemplateMasterObjectPage: TemplateMasterObjectPage
        },
        async: true
    });

    return runner;
});

