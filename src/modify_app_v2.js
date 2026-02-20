
import fs from 'fs';

const filePath = 'd:/fish id/error free/src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const startTarget = '<div className="relative p-6 mt-6 overflow-hidden border bg-white/5 border-white/10 rounded-2xl">';

let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startTarget)) {
        startIndex = i;
        break;
    }
}

if (startIndex === -1) {
    console.error('Start marker not found!');
    process.exit(1);
}

const indent = lines[startIndex].match(/^\s*/)[0];

let endIndex = -1;
for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Check if line is just matching indent + </div>
    if (line.trim() === '</div>' && line.indexOf('</div>') === indent.length) {
        // Check next line for )}
        // But there might be empty lines
        let nextLineIndex = i + 1;
        while (lines[nextLineIndex].trim() === '') nextLineIndex++;

        if (lines[nextLineIndex].trim() === ')}') {
            endIndex = i;
            break;
        }
    }
}

if (endIndex === -1) {
    console.error('End marker not found! Dumping potential candidates:');
    for (let i = startIndex + 100; i < startIndex + 150; i++) {
        if (lines[i].trim() === '</div>') {
            console.log(`Potential match at ${i}: indelt len ${lines[i].indexOf('</div>')}, expected ${indent.length}`);
        }
    }
    process.exit(1);
}

console.log(`Replacing lines ${startIndex + 1} to ${endIndex + 1}`);
// Replace content
const replacement = `${indent}<div className="mt-8">\n${indent}  <FishAnalysisDashboard result={result} image={image} onNewScan={clearImage} />\n${indent}</div>`;
lines.splice(startIndex, endIndex - startIndex + 1, replacement);

const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated App.tsx');
