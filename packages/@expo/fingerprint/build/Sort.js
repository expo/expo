"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortSources = void 0;
function sortSources(sources) {
    const typeOrder = {
        file: 0,
        dir: 1,
        contents: 2,
    };
    return sources.sort((a, b) => {
        const typeResult = typeOrder[a.type] - typeOrder[b.type];
        if (typeResult === 0) {
            if (a.type === 'file' && b.type === 'file') {
                return a.filePath.localeCompare(b.filePath);
            }
            else if (a.type === 'dir' && b.type === 'dir') {
                return a.filePath.localeCompare(b.filePath);
            }
            else if (a.type === 'contents' && b.type === 'contents') {
                return a.id.localeCompare(b.id);
            }
        }
        return typeResult;
    });
}
exports.sortSources = sortSources;
//# sourceMappingURL=Sort.js.map