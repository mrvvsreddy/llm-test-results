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

            const registryItem = {
                id: folder,
                path: `tests/${folder}`,
                ...meta,
                code_a,
                code_b
            };

            // Generate Standalone view.html for this test
            const viewHtml = generateStandaloneHtml(registryItem);
            fs.writeFileSync(path.join(folderPath, 'view.html'), viewHtml);

            return registryItem;
        }
        return null;
    }).filter(Boolean);

    const DATA_FILE = path.join(__dirname, 'data.js');
    const scriptContent = `window.TESTS_REGISTRY = ${JSON.stringify(registry, null, 2)};`;
    fs.writeFileSync(DATA_FILE, scriptContent);
    console.log(`Successfully updated data.js and all standalone view.html files.`);
}

function generateStandaloneHtml(test) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${test.title} - LLM Stress Test</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../index.css">
    <style>
        body { margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--bg-dark); }
        .back-link { position: fixed; bottom: 20px; right: 20px; background: var(--accent); color: white; padding: 10px 20px; border-radius: 30px; text-decoration: none; font-weight: 600; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.2s; }
        .back-link:hover { transform: scale(1.05); }
    </style>
</head>
<body class="main-viewport">
    <div class="top-bar">
        <div class="meta-grid">
            <div class="meta-item">
                <label>Test Title</label>
                <p>${test.title}</p>
            </div>
            <div class="meta-item">
                <label>Comparison</label>
                <p>${test.model_a} vs ${test.model_b}</p>
            </div>
            <div class="meta-item">
                <label>Date</label>
                <p>${test.date}</p>
            </div>
            <div class="meta-item" style="flex: 1; min-width: 0;">
                <label>Prompt</label>
                <p style="font-size: 0.75rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${test.prompt}</p>
            </div>
        </div>
    </div>

    <div class="comparison-area">
        <div class="result-pane">
            <div class="pane-header">
                <span>${test.model_a}</span>
            </div>
            <div class="iframe-container">
                <iframe src="result_1.html"></iframe>
            </div>
        </div>
        <div class="result-pane">
            <div class="pane-header">
                <span>${test.model_b}</span>
            </div>
            <div class="iframe-container">
                <iframe src="result_2.html"></iframe>
            </div>
        </div>
    </div>

    <a href="../../index.html" class="back-link">Back to Hub</a>
</body>
</html>`;
}

updateRegistry();
