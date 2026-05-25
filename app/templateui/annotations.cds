using TemplateService as service from '../../srv/template-service';
annotate service.TemplateMaster with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'templateName',
                Value : templateName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'templateType',
                Value : templateType,
            },
            {
                $Type : 'UI.DataField',
                Label : 'sheetMode',
                Value : sheetMode,
            },
            {
                $Type : 'UI.DataField',
                Label : 'status',
                Value : status,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'templateName',
            Value : templateName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'templateType',
            Value : templateType,
        },
        {
            $Type : 'UI.DataField',
            Label : 'sheetMode',
            Value : sheetMode,
        },
        {
            $Type : 'UI.DataField',
            Label : 'status',
            Value : status,
        },
    ],
);

