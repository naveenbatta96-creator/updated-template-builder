const cds =require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');
const XLSX = require('xlsx');


module.exports = cds.service.impl(async function() {
    this.on('downloadTemplate', async (req) => {
        const {templateID, exportMode} = req.data;
        const template = await SELECT.one.from('TemplateMaster')
        .where({ID : templateID})
        .columns(t =>
        { t.TemplateName, 
            t.mappings(m => {
                m.field(f => {
                    f.levelName 
                    f.fieldName
                    f.sapType
                })
         })  
    })
});

if(!template || !template.mappings)){
    return req.error(404, 'Template not found');
}
//clean up rew json
const aExcelData = template.mappings.map(m  => {
    return {
       "Level Name" : m.levelName,
       "Field Name" : m.fieldName,
       "SAP Type" : m.sapType
    }
});
//create a new workbook and add the data
const oWorkbook = XLSX.utils.book_new();
if(exportMode === 'SINGLE') {
    const oWorksheet = XLSX.utils.json_to_sheet(aExcelData);
    XLSX.utils.book_append_sheet(oWorkbook, oWorksheet, 'Template');
} else if (exportMode === 'MULTIPLE') {
    //group data by level name
    const mGroupedData = aExcelData.reduce((acc, curr) => {
