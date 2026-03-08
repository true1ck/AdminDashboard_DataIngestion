const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', 'DataCollected');
console.log('Scanning Root:', rootDir);
if (!fs.existsSync(rootDir)) {
    console.log('Directory does not exist!');
    process.exit(1);
}

let discovered = 0;
const fileResults = [];

function scanDir(dir, relPath = '') {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const fullPath = path.join(dir, entry.name);
            const itemRelPath = path.join(relPath, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath, itemRelPath);
            } else if (entry.isFile() && entry.name.endsWith('.txt')) {
                discovered++;
                fileResults.push({ fullPath, relPath: itemRelPath, name: entry.name, folder: relPath });
            }
        }
    } catch (e) { console.log('Error scanning:', dir, e.message); }
}

scanDir(rootDir);
console.log('Result:', discovered, 'files found');
if (fileResults.length > 0) {
    console.log('First file:', fileResults[0]);
}
