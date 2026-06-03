using TemplateService as service from '../../srv/template-service';

annotate service.TemplateMasterWithCount with @(
    UI.HeaderInfo                : {
        TypeName      : 'Template',
        TypeNamePlural: 'Template Builder',
        Title         : {
            $Type: 'UI.DataField',
            Value: templateName,
        }
    },
    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'TemplateName',
                Value: templateName,
            },
            {
                $Type: 'UI.DataField',
                Label: 'SemplateType',
                Value: templateType,
            },
            {
                $Type: 'UI.DataField',
                Label: 'SheetMode',
                Value: sheetMode,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Status',
                Value: status,
            },
            {
                $Type: 'UI.DataField',
                Label: 'MappingsCount',
                Value: mappingsCount,
            },
        ],
    },
    UI.Facets                    : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup',
    }, ],
    UI.LineItem                  : [
        {
            $Type: 'UI.DataField',
            Label: 'TemplateName',
            Value: templateName,
        },
        {
            $Type: 'UI.DataField',
            Label: 'TemplateType',
            Value: templateType,
        },
        {
            $Type: 'UI.DataField',
            Label: 'SheetMode',
            Value: sheetMode,
        },

        {
            $Type: 'UI.DataField',
            Label: 'MappingsCount',
            Value: mappingsCount,
        },
        {
            $Type                   : 'UI.DataFieldForAction',
            Label                   : 'Download',
            Action                  : 'TemplateService.downloadTemplate',
            Inline                  : true,
            IconUrl                 : 'sap-icon://download',
            @Core.OperationAvailable: true
        },
        {
            $Type: 'UI.DataField',
            Label: 'Status',
            Value: status,
        },
    ],
);
