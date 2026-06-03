using lockbox.templatebuilder as db from '../db/schema';

service TemplateService {
    type DownloadResult {
        fileName    : String;
        fileContent : String;
        mimeType    : String;
    }

    @cds.redirection.target
    entity TemplateMaster          as projection on db.TemplateMaster;

    entity FieldMaster             as projection on db.FieldMaster;

    entity TemplateFieldMapping    as projection on db.TemplateFieldMapping;

    entity TemplateMasterWithCount as
        projection on TemplateMaster {
            *,
            virtual null as mappingsCount : Integer
        }
        actions {
            @Core.OperationAvailable: true
            @odata.mediaType        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            action downloadTemplate() returns LargeBinary;
        };

    type ChosenField {
        fieldID          : UUID;
        level            : String;
        fieldDescription : String;
        propertyType     : String;
        maxLength        : Integer;
    }

    action createTemplateWithFields(templateName: String,
                                    templateType: String,
                                    chosenFields: many ChosenField) returns String;
}
