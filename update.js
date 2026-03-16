const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, 'tests');
const REGISTRY_FILE = path.join(__dirname, 'registry.json');

function updateRegistry() {
    if (!fs.existsSync(TESTS_DIR)) {
        fs.mkdirSync(TESTS_DIR);
        // Create a template folder if it doesn't exist
        const templateDir = path.join(TESTS_DIR, '2026-03-16_Template-Test');
        fs.mkdirSync(templateDir, { recursive: true });
        fs.writeFileSync(path.join(templateDir, 'meta.json'), JSON.stringify({
            title: "Template Test",
            model_a: "Claude",
            model_b: "GPT",
            prompt: "Example prompt here...",
            date: "2026-03-16",
            tags: ["example"]
        }, null, 2));
        fs.writeFileSync(path.join(templateDir, 'result_1.html'), "<h1>Model A Result</h1>");
        fs.writeFileSync(path.join(templateDir, 'result_2.html'), "<h1>Model B Result</h1>");
    }

    const testFolders = fs.readdirSync(TESTS_DIR).filter(f => 
        fs.lstatSync(path.join(TESTS_DIR, f)).isDirectory()
    );

    const registry = testFolders.map(folder => {
        const folderPath = path.join(TESTS_DIR, folder);
        const metaPath = path.join(folderPath, 'meta.json');
        
        if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            
            // Read source code for the viewer
            let code_a = "";
            let code_b = "";
            
            const pathA = path.join(folderPath, 'result_1.html');
            const pathB = path.join(folderPath, 'result_2.html');
            
            if (fs.existsSync(pathA)) code_a = fs.readFileSync(pathA, 'utf8');
            if (fs.existsSync(pathB)) code_b = fs.readFileSync(pathB, 'utf8');

            return {
                id: folder,
                path: `tests/${folder}`,
                ...meta,
                code_a,
                code_b
            };
        }
        return null;
    }).filter(Boolean);

    const DATA_FILE = path.join(__dirname, 'data.js');
    const scriptContent = `window.TESTS_REGISTRY = ${JSON.stringify(registry, null, 2)};`;
    fs.writeFileSync(DATA_FILE, scriptContent);
    console.log(`Successfully updated data.js with ${registry.length} tests and source code.`);
}

updateRegistry();
