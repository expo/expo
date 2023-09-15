"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripInvisibleSegmentsFromPath = exports.stripGroupSegmentsFromPath = exports.removeFileSystemDots = exports.removeSupportedExtensions = exports.getContextKey = exports.getNameFromFilePath = exports.matchGroupName = exports.matchDeepDynamicRouteName = exports.matchDynamicName = void 0;
/** Match `[page]` -> `page` */
function matchDynamicName(name) {
    // Don't match `...` or `[` or `]` inside the brackets
    // eslint-disable-next-line no-useless-escape
    return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1];
}
exports.matchDynamicName = matchDynamicName;
/** Match `[...page]` -> `page` */
function matchDeepDynamicRouteName(name) {
    return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}
exports.matchDeepDynamicRouteName = matchDeepDynamicRouteName;
/** Match `(page)` -> `page` */
function matchGroupName(name) {
    return name.match(/^\(([^/]+?)\)$/)?.[1];
}
exports.matchGroupName = matchGroupName;
function getNameFromFilePath(name) {
    return removeSupportedExtensions(removeFileSystemDots(name));
}
exports.getNameFromFilePath = getNameFromFilePath;
function getContextKey(name) {
    // The root path is `` (empty string) so always prepend `/` to ensure
    // there is some value.
    const normal = '/' + getNameFromFilePath(name);
    if (!normal.endsWith('_layout')) {
        return normal;
    }
    return normal.replace(/\/?_layout$/, '');
}
exports.getContextKey = getContextKey;
/** Remove `.js`, `.ts`, `.jsx`, `.tsx` */
function removeSupportedExtensions(name) {
    return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}
exports.removeSupportedExtensions = removeSupportedExtensions;
// Remove any amount of `./` and `../` from the start of the string
function removeFileSystemDots(filePath) {
    return filePath.replace(/^(?:\.\.?\/)+/g, '');
}
exports.removeFileSystemDots = removeFileSystemDots;
function stripGroupSegmentsFromPath(path) {
    return path
        .split('/')
        .reduce((acc, v) => {
        if (matchGroupName(v) == null) {
            acc.push(v);
        }
        return acc;
    }, [])
        .join('/');
}
exports.stripGroupSegmentsFromPath = stripGroupSegmentsFromPath;
function stripInvisibleSegmentsFromPath(path) {
    return stripGroupSegmentsFromPath(path).replace(/\/?index$/, '');
}
exports.stripInvisibleSegmentsFromPath = stripInvisibleSegmentsFromPath;
//# sourceMappingURL=matchers.js.map