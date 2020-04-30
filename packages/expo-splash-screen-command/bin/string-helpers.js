"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// runtime polyfills
require("core-js/es/string/match-all");
/**
 * @returns [`true`, modifiedContent: string] if replacement is successful, [`false`, originalContent] otherwise.
 */
function replace(content, { replaceContent, replacePattern }) {
    const replacePatternOccurrence = content.search(replacePattern);
    if (replacePatternOccurrence !== -1) {
        return [true, content.replace(replacePattern, replaceContent)];
    }
    return [false, content];
}
exports.replace = replace;
/**
 * Inserts content just before first occurrence of provided pattern.
 * @returns [`true`, modifiedContent: string] if insertion is successful, [`false`, originalContent] otherwise.
 */
function insert(content, { insertContent, insertPattern }, insertBeforeLastOccurrence = false) {
    if (insertBeforeLastOccurrence) {
        return insertBeforeLastOccurrenceFun(content, { insertContent, insertPattern });
    }
    const insertPatternOccurrence = content.search(insertPattern);
    if (insertPatternOccurrence !== -1) {
        return [
            true,
            `${content.slice(0, insertPatternOccurrence)}${insertContent}${content.slice(insertPatternOccurrence)}`,
        ];
    }
    return [false, content];
}
exports.insert = insert;
/**
 * Finds last occurrence of provided pattern and inserts content just before it.
 *@returns [`true`, modifiedContent: string] if insertion is successful, [`false`, originalContent] otherwise.
 */
function insertBeforeLastOccurrenceFun(content, { insertContent, insertPattern }) {
    const results = [...content.matchAll(new RegExp(insertPattern, 'gm'))];
    const patternLastOccurrence = results[results.length - 1];
    if (!patternLastOccurrence) {
        return [false, content];
    }
    return [
        true,
        `${content.slice(0, patternLastOccurrence.index)}${insertContent}${content.slice(patternLastOccurrence.index)}`,
    ];
}
//# sourceMappingURL=string-helpers.js.map