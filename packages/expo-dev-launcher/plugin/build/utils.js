"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceLine = exports.addLines = void 0;
function addLines(content, find, offset, toAdd) {
    const lines = content.split('\n');
    let lineIndex = lines.findIndex((line) => line.match(find));
    for (const newLine of toAdd) {
        if (!content.includes(newLine)) {
            lines.splice(lineIndex + offset, 0, newLine);
            lineIndex++;
        }
    }
    return lines.join('\n');
}
exports.addLines = addLines;
function replaceLine(content, find, replace) {
    const lines = content.split('\n');
    if (!content.includes(replace)) {
        const lineIndex = lines.findIndex((line) => line.match(find));
        lines.splice(lineIndex, 1, replace);
    }
    return lines.join('\n');
}
exports.replaceLine = replaceLine;
