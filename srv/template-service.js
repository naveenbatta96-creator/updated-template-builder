const cds = require('@sap/cds');
const XLSX = require('xlsx');

module.exports = cds.service.impl(async function () {

    const { TemplateMaster, TemplateFieldMapping, FieldMaster, TemplateMasterWithCount } = this.entities;

    // ================================================================
    // Calculate mappingsCount dynamically after READ
    // ================================================================
    this.after('READ', 'TemplateMasterWithCount', async (each) => {
        if (!each) return;
        const aEntries = Array.isArray(each) ? each : [each];
        for (const item of aEntries) {
            if (item.ID) {
                const countRes = await SELECT.one
                    .from(TemplateFieldMapping)
                    .where({ template_ID: item.ID })
                    .columns('count(*) as count');
                item.mappingsCount = countRes && countRes.count
                    ? parseInt(countRes.count, 10)
                    : 0;
            }
        }
    });

    // ================================================================
    // Intercept CREATE on TemplateMaster
    // Forces insert into real base table instead of the view
    // ================================================================
    this.on('CREATE', TemplateMaster, async (req) => {
        try {
            await INSERT.into('lockbox.templatebuilder.TemplateMaster').entries(req.data);
            return req.data;
        } catch (err) {
            console.error("CREATE TemplateMaster failed:", err);
            return req.error(500, err.message);
        }
    });

    // ================================================================
    // Download Template as Excel
    // ================================================================
    // ================================================================
    // Download Template as Excel (Streamed Native Download)
    // ================================================================
    this.on('downloadTemplate', 'TemplateMasterWithCount', async (req) => {
        try {
            const { exportMode } = req.data;
            const param = req.params && req.params[0];
            const templateID = (typeof param === 'object' ? param.ID : param)
                || req.data.templateID
                || req.data.ID;
            console.log("downloadTemplate triggered for ID:", templateID);

            if (!templateID) {
                return req.error(400, 'Template ID is missing.');
            }

            // 1. Fetch template basic info
            const template = await SELECT.one
                .from('lockbox.templatebuilder.TemplateMaster')
                .where({ ID: templateID })
                .columns('templateName', 'templateType', 'sheetMode');

            if (!template) {
                return req.error(404, 'Template not found.');
            }

            // 2. Fetch all field mappings for this template
            const aMappings = await SELECT
                .from('lockbox.templatebuilder.TemplateFieldMapping')
                .where({ template_ID: templateID })
                .columns('field_ID', 'sequenceNo');

            if (!aMappings || aMappings.length === 0) {
                return req.error(404, 'No fields are mapped to this template.');
            }

            // 3. Fetch FieldMaster details for all mapped field IDs
            const aFieldIDs = aMappings.map(m => m.field_ID);

            const aFields = await SELECT
                .from('lockbox.templatebuilder.FieldMaster')
                .where({ ID: { in: aFieldIDs } })
                .columns('ID', 'levelName', 'fieldName', 'sapType');

            // 4. Join mappings with field details, sorted by sequenceNo
            const aExcelData = aMappings
                .sort((a, b) => a.sequenceNo - b.sequenceNo)
                .map(mapping => {
                    const field = aFields.find(f => f.ID === mapping.field_ID);
                    return {
                        "Level Name": field ? field.levelName : '',
                        "Field Name": field ? field.fieldName : '',
                        "SAP Type": field ? field.sapType : ''
                    };
                });

            // 5. Build Excel workbook
            const oWorkbook = XLSX.utils.book_new();
            const isMultiple =
                template.sheetMode === 'MULTIPLE' ||
                template.templateType === 'Multiple' ||
                template.templateType === 'Multiple sheets' ||
                template.templateType === 'Multiple sheet' ||
                template.templateType === 'Multi';

            if (!isMultiple) {
                // Single sheet mode
                const oWorksheet = XLSX.utils.json_to_sheet(aExcelData);
                XLSX.utils.book_append_sheet(oWorkbook, oWorksheet, 'Template');
            } else {
                // Multiple sheets mode — one sheet per level
                const oGroupedData = {};
                aExcelData.forEach(row => {
                    const level = row["Level Name"] || "Unassigned";
                    if (!oGroupedData[level]) oGroupedData[level] = [];
                    oGroupedData[level].push(row);
                });
                for (const levelName in oGroupedData) {
                    const oSheet = XLSX.utils.json_to_sheet(oGroupedData[levelName]);
                    XLSX.utils.book_append_sheet(oWorkbook, oSheet, levelName);
                }
            }

            // ... Your steps 1 to 5 ...

            // 6. Output workbook as a Node raw memory Buffer
            const fileBuffer = XLSX.write(oWorkbook, { type: 'buffer', bookType: 'xlsx' });

            // 7. Inject Custom HTTP Response Headers
            const sCustomFileName = `${template.templateName}_Configuration.xlsx`;
            req._.res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sCustomFileName)}"`);
            req._.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            req._.res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

            // 8. Return the buffer assigned to your CDS 'content' property name
            return fileBuffer;

        } catch (err) {
            console.error("downloadTemplate crashed:", err);
            return req.error(500, err.message);
        }
    });

    // ================================================================
    // Create Template with Fields in one shot (Custom Action)
    // ================================================================
    this.on('createTemplateWithFields', async (req) => {
        try {
            const { templateName, templateType, chosenFields } = req.data;

            // 1. Validate inputs
            if (!templateName || !templateName.trim()) {
                return req.error(400, 'Template Name is required.');
            }

            if (!chosenFields || chosenFields.length === 0) {
                return req.error(400, 'At least one field must be selected.');
            }

            const sTemplateId = cds.utils.uuid();

            // 2. Insert into TemplateMaster
            await INSERT.into('lockbox.templatebuilder.TemplateMaster').entries({
                ID: sTemplateId,
                templateName: templateName.trim(),
                templateType: templateType,
                sheetMode: templateType === 'Single' ? 'SINGLE' : 'MULTIPLE',
                status: 'Active'
            });

            // 3. Insert all field mapping records
            const aMappings = chosenFields.map((field, index) => ({
                ID: cds.utils.uuid(),
                template_ID: sTemplateId,
                field_ID: field.fieldID,
                sequenceNo: index + 1,
                apiField: '',
                mappingRule: '',
                ruleId: ''
            }));

            await INSERT.into('lockbox.templatebuilder.TemplateFieldMapping').entries(aMappings);

            console.log(`Template '${templateName}' created with ${aMappings.length} field(s).`);
            return "Success";

        } catch (err) {
            console.error("createTemplateWithFields crashed:", err);
            return req.error(500, err.message);
        }
    });

}); // closes module.exports