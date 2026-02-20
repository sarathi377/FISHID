
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

console.log(`Start index found at: ${startIndex}`);
const indent = lines[startIndex].match(/^\s*/)[0];
console.log(`Indent length: ${indent.length}`);

// Debug: print lines around where we expect end
// We expected around 130 lines.
for (let i = startIndex + 125; i < startIndex + 140; i++) {
    if (i < lines.length) {
        console.log(`${i}: '${lines[i]}'`);
    }
}
