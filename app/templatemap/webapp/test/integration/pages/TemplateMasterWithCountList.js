sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'nav.tmp.map.templatemap',
            componentId: 'TemplateMasterWithCountList',
            contextPath: '/TemplateMasterWithCount'
        },
        CustomPageDefinitions
    );
});