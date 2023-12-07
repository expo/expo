"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIgnoredPath = void 0;
const minimatch_1 = __importDefault(require("minimatch"));
/**
 * Indicate the given `filePath` should be excluded by `ignorePaths`
 */
function isIgnoredPath(filePath, ignorePaths, minimatchOptions = { dot: true }) {
    const minimatchObjs = ignorePaths.map((ignorePath) => new minimatch_1.default.Minimatch(ignorePath, minimatchOptions));
    let result = false;
    for (const minimatchObj of minimatchObjs) {
        const currMatch = minimatchObj.match(filePath);
        if (minimatchObj.negate && result && !currMatch) {
            // Special handler for negate (!pattern).
            // As long as previous match result is true and not matched from the current negate pattern, we should early return.
            return false;
        }
        result ||= currMatch;
    }
    return result;
}
exports.isIgnoredPath = isIgnoredPath;
//# sourceMappingURL=Path.js.map