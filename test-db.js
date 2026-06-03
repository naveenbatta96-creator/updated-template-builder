const cds = require('@sap/cds');

async function main() {
    try {
        const db = await cds.connect.to('db');
        console.log("=== Active Templates ===");
        const active = await db.run("SELECT * FROM lockbox_templatebuilder_TemplateMaster");
        console.log(active);

        console.log("=== Service Active View ===");
        const srvActive = await db.run("SELECT * FROM templateservice_templatemasterwithcount");
        console.log(srvActive);

        console.log("=== Drafts Table ===");
        const drafts = await db.run("SELECT * FROM templateservice_templatemasterwithcount_drafts");
        console.log(drafts);
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
