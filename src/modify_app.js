
import fs from 'fs';

const filePath = 'd:/fish id/error free/src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Target string to identify the start of the block to replace
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

// Ensure the line before starts with the condition
// Note: line index i corresponds to line i+1 in editor
// Check lines[startIndex-1] for condition
const conditionLine = lines[startIndex - 1];
if (!conditionLine.includes('result && !result.error')) {
    console.error('Condition line not found at expected position!');
    console.log('Found:', conditionLine);
    process.exit(1);
}

// Find the end of the block. It should be the closing div before the closing condition `)}`.
// We know from inspection it's around 130 lines down.
// We can count parens or just look for the known closing structure.
// The block ends with </div> then )}
// Let's look for the matching closing div.
// Simple approach: Iterate and count divs? No, regex?
// Let's assume the indentation level matches.
// The start line has indentation.
const indent = lines[startIndex].match(/^\s*/)[0];
let endIndex = -1;

for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i] === indent + '</div>' && lines[i + 1]?.trim() === ')}') {
        endIndex = i;
        break;
    }
}

if (endIndex === -1) {
    console.error('End marker not found!');
    process.exit(1);
}

console.log(`Replacing lines ${startIndex + 1} to ${endIndex + 1}`);

// Replace the lines
const replacement = `${indent}<FishAnalysisDashboard result={result} image={image} onNewScan={clearImage} />`;
lines.splice(startIndex, endIndex - startIndex + 1, replacement);

const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated App.tsx');
