using lockbox.templatebuilder as db from '../db/schema';

service TemplateService {

    
    entity TemplateMaster
        as projection on db.TemplateMaster;

    entity FieldMaster
        as projection on db.FieldMaster;

    entity TemplateFieldMapping
        as projection on db.TemplateFieldMapping;

    action addFieldsToTemplate(
        templateId : UUID,
        fieldIds   : many UUID
    );
}