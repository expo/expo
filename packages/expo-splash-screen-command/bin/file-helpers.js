"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// runtime polyfills
require("core-js/es/string/match-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
exports.COMMENTS = {
    wrapXML: (comment) => `<!-- ${comment} -->`,
    wrapJavaKotlin: (comment) => `// ${comment}`,
    LINE: `This line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually`,
    FILE_TOP: `\n    This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand\n`,
    FILE_TOP_NO_MODIFY: `\n    This file was created by 'expo-splash-screen' command and it's discouraged to modify it manually\n`,
    ANDROID_MANIFEST: `This Activity's 'android:theme' attribute is handled by 'expo-splash-screen' command and it's discouraged to modify it manually`,
};
/**
 * Modifies file's content if either `replacePattern` or `insertPattern` matches.
 * If `replacePattern` matches, `replaceContent` is used, otherwise if `insertPattern` matches, `insertContent` is used.
 * `insertBeforeLastOccurrence` - flag that indicates whether to insert before first or last occurrence.
 * @returns object describing which operation is successful.
 */
async function replaceOrInsertInFile(filePath, { replaceContent, replacePattern, insertContent, insertPattern, insertBeforeLastOccurrence, }) {
    const insertFunction = insertBeforeLastOccurrence
        ? insertToFileBeforeLastOccurrence
        : insertToFile;
    const replaced = await replaceInFile(filePath, { replaceContent, replacePattern });
    const inserted = !replaced && (await insertFunction(filePath, { insertContent, insertPattern }));
    return { replaced, inserted };
}
exports.replaceOrInsertInFile = replaceOrInsertInFile;
/**
 * Tries to do following actions:
 * - when file doesn't exist or is empty - create it with given fileContent,
 * - when file does exist and contains provided replacePattern - replace replacePattern with replaceContent,
 * - when file does exist and doesn't contain provided replacePattern - insert given insertContent before first match of insertPattern,
 * - when insertPattern does not occur in the file - append insertContent to the end of the file.
 * @returns object describing which operation is successful.
 */
async function writeOrReplaceOrInsertInFile(filePath, { fileContent, replaceContent, replacePattern, insertContent, insertPattern, }) {
    if (!(await fs_extra_1.default.pathExists(filePath)) || !/\S/m.test(await fs_extra_1.default.readFile(filePath, 'utf8'))) {
        await writeToFile(filePath, fileContent);
        return { created: true };
    }
    const { replaced, inserted } = await replaceOrInsertInFile(filePath, {
        replaceContent,
        replacePattern,
        insertContent,
        insertPattern,
    });
    if (replaced || inserted) {
        return { replaced, inserted };
    }
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    await fs_extra_1.default.writeFile(filePath, `${originalFileContent}${insertPattern}`);
    return { inserted: true };
}
exports.writeOrReplaceOrInsertInFile = writeOrReplaceOrInsertInFile;
/**
 * Overrides or creates file (with possibly missing directories) with given content.
 */
async function writeToFile(filePath, fileContent) {
    const fileDirnamePath = path_1.default.dirname(filePath);
    if (!(await fs_extra_1.default.pathExists(fileDirnamePath))) {
        await fs_extra_1.default.mkdirp(fileDirnamePath);
    }
    return await fs_extra_1.default.writeFile(filePath, fileContent);
}
exports.writeToFile = writeToFile;
/**
 * @returns `true` if replacement is successful, `false` otherwise.
 */
async function replaceInFile(filePath, { replaceContent, replacePattern }) {
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    const replacePatternOccurrence = originalFileContent.search(replacePattern);
    if (replacePatternOccurrence !== -1) {
        await fs_extra_1.default.writeFile(filePath, originalFileContent.replace(replacePattern, replaceContent));
        return true;
    }
    return false;
}
exports.replaceInFile = replaceInFile;
/**
 * Inserts content just before first occurrence of provided pattern.
 * @returns `true` if insertion is successful, `false` otherwise.
 */
async function insertToFile(filePath, { insertContent, insertPattern }) {
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    const insertPatternOccurrence = originalFileContent.search(insertPattern);
    if (insertPatternOccurrence !== -1) {
        await fs_extra_1.default.writeFile(filePath, `${originalFileContent.slice(0, insertPatternOccurrence)}${insertContent}${originalFileContent.slice(insertPatternOccurrence)}`);
        return true;
    }
    return false;
}
exports.insertToFile = insertToFile;
/**
 * Finds last occurrence of provided pattern and inserts content just before it.
 * @return `true` is insertion is successful, `false` otherwise.
 */
async function insertToFileBeforeLastOccurrence(filePath, { insertContent, insertPattern }) {
    const originalFileContent = await fs_extra_1.default.readFile(filePath, 'utf8');
    const results = [...originalFileContent.matchAll(new RegExp(insertPattern, 'gm'))];
    const patternLastOccurrence = results[results.length - 1];
    if (!patternLastOccurrence) {
        return false;
    }
    await fs_extra_1.default.writeFile(filePath, `${originalFileContent.slice(0, patternLastOccurrence.index)}${insertContent}${originalFileContent.slice(patternLastOccurrence.index)}`);
    return true;
}
exports.insertToFileBeforeLastOccurrence = insertToFileBeforeLastOccurrence;
//# sourceMappingURL=file-helpers.js.map