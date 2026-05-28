const cds = require('@sap/cds');
const XLSX = require('xlsx');

module.exports = cds.service.impl(async function() {
    
    this.on('downloadTemplate', async (req) => {
        const {templateID, exportMode} = req.data;
        
        // 1. Fetch data from DB (Fixed commas)
        const template = await SELECT.one.from('TemplateMaster')
        .where({ID : templateID})
        .columns(t => { 
            t.templateName, 
            t.mappings(m => {
                m.field(f => {
                    f.levelName, 
                    f.fieldName,
                    f.sapType
                })
         })  
        }); // Do NOT close the this.on block here!

        // 2. Validation (Fixed extra parenthesis)
        if(!template || !template.mappings) {
            return req.error(404, 'Template not found');
        }

        // 3. Clean up raw JSON (Fixed m.field targeting)
        const aExcelData = template.mappings.map(m  => {
            return {
               "Level Name" : m.field.levelName,
               "Field Name" : m.field.fieldName,
               "SAP Type" : m.field.sapType
            }
        });

        // 4. Create a new workbook and add the data
        const oWorkbook = XLSX.utils.book_new();

        if(exportMode === 'SINGLE') {
            const oWorksheet = XLSX.utils.json_to_sheet(aExcelData);
            XLSX.utils.book_append_sheet(oWorkbook, oWorksheet, 'Template');
            
        } else if (exportMode === 'MULTIPLE') {
            // Group data by level name
            const oGroupedData = {};
            
            aExcelData.forEach(row => {
                // Fixed: Matched the exact column name "Level Name"
                const level = row["Level Name"] || "Unassigned";
                
                // Fixed logic: Create array if it doesn't exist, then push
                if(!oGroupedData[level]) { 
                    oGroupedData[level] = [];
                }
                oGroupedData[level].push(row); 
            });
            
            // Separate sheet for each bucket
            for (const levelName in oGroupedData) {
                const oSheet = XLSX.utils.json_to_sheet(oGroupedData[levelName]);
                XLSX.utils.book_append_sheet(oWorkbook, oSheet, levelName);
            }
        }

        // 5. Converting to binary and send to browser
        const buffer = XLSX.write(oWorkbook, { type : 'buffer', bookType : 'xlsx'});

        // Hijack Express.js response to force a file download 
        req._.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        req._.res.setHeader('Content-Disposition', `attachment; filename="${template.templateName}_Configuration.xlsx"`);
        
        return req._.res.send(buffer);
        
    }); // <-- Closes this.on

}); // <-- Closes module.exports