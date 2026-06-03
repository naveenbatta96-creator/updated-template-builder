const cds = require('@sap/cds');
const { execSync } = require('child_process');

async function main() {
    try {
        console.log("Connecting to database...");
        const db = await cds.connect.to('db');
        
        console.log("Re-creating cds_model table...");
        await db.run(`
            CREATE TABLE IF NOT EXISTS cds_model (
                key VARCHAR(255) PRIMARY KEY,
                csn TEXT
            )
        `);

        console.log("Compiling complete project CSN using CLI...");
        const csnString = execSync('npx cds compile db srv --to json', { encoding: 'utf8', cwd: 'c:/Users/Naveen/Desktop/updated-template-builder' });
        
        const csnObj = JSON.parse(csnString);
        console.log("CSN successfully compiled. Definitions count:", Object.keys(csnObj.definitions || {}).length);

        console.log("Inserting current model CSN into cds_model table...");
        await db.run("DELETE FROM cds_model");
        await db.run("INSERT INTO cds_model (key, csn) VALUES ($1, $2)", ['default', csnString]);
        
        console.log("Done! cds_model table updated with current schema.");
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
