"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIgnoredPathWithMatchObjects = exports.buildPathMatchObjects = exports.isIgnoredPath = void 0;
const minimatch_1 = __importDefault(require("minimatch"));
/**
 * Indicate the given `filePath` should be excluded by the `ignorePaths`.
 */
function isIgnoredPath(filePath, ignorePaths, minimatchOptions = { dot: true }) {
    const matchObjects = buildPathMatchObjects(ignorePaths, minimatchOptions);
    return isIgnoredPathWithMatchObjects(filePath, matchObjects);
}
exports.isIgnoredPath = isIgnoredPath;
/**
 * Prebuild match objects for `isIgnoredPathWithMatchObjects` calls.
 */
function buildPathMatchObjects(paths, minimatchOptions = { dot: true }) {
    return paths.map((filePath) => new minimatch_1.default.Minimatch(filePath, minimatchOptions));
}
exports.buildPathMatchObjects = buildPathMatchObjects;
/**
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
function isIgnoredPathWithMatchObjects(filePath, matchObjects) {
    let result = false;
    for (const minimatchObj of matchObjects) {
        const normalizedFilePath = normalizeFilePath(filePath);
        const currMatch = minimatchObj.match(normalizedFilePath);
        if (minimatchObj.negate && result && !currMatch) {
            // Special handler for negate (!pattern).
            // As long as previous match result is true and not matched from the current negate pattern, we should early return.
            return false;
        }
        result ||= currMatch;
    }
    return result;
}
exports.isIgnoredPathWithMatchObjects = isIgnoredPathWithMatchObjects;
const STRIP_NODE_MODULES_PREFIX_REGEX = /^(\.\.\/)+(node_modules\/)/g;
/**
 * Normalize the given `filePath` to be used for matching against `ignorePaths`.
 *
 * - When people use fingerprint inside a monorepo, they may get source files from parent directories.
 *   However, minimatch '**' doesn't match the parent directories.
 *   We need to strip the `../` prefix to match the node_modules from parent directories.
 */
function normalizeFilePath(filePath) {
    return filePath.replace(STRIP_NODE_MODULES_PREFIX_REGEX, '$2');
}
//# sourceMappingURL=Path.js.map