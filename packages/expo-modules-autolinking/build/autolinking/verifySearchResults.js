"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySearchResults = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
/**
 * Verifies the search results by checking whether there are no duplicates.
 */
function verifySearchResults(searchResults) {
    const cwd = process.cwd();
    const relativePath = (pkg) => path_1.default.relative(cwd, pkg.path);
    let counter = 0;
    for (const moduleName in searchResults) {
        const revision = searchResults[moduleName];
        if (revision.duplicates?.length) {
            console.warn(`⚠️  Found multiple revisions of ${chalk_1.default.green(moduleName)}`);
            console.log(` - ${chalk_1.default.magenta(relativePath(revision))} (${chalk_1.default.cyan(revision.version)})`);
            for (const duplicate of revision.duplicates) {
                console.log(` - ${chalk_1.default.gray(relativePath(duplicate))} (${chalk_1.default.gray(duplicate.version)})`);
            }
            counter++;
        }
    }
    if (counter > 0) {
        console.warn('⚠️  Please get rid of multiple revisions as it may introduce some side effects or compatibility issues');
    }
    return counter;
}
exports.verifySearchResults = verifySearchResults;
//# sourceMappingURL=verifySearchResults.js.map