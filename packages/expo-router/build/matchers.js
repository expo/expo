"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTypedRoute = exports.stripInvisibleSegmentsFromPath = exports.stripGroupSegmentsFromPath = exports.removeFileSystemDots = exports.removeSupportedExtensions = exports.getContextKey = exports.getNameFromFilePath = exports.matchArrayGroupName = exports.matchGroupName = exports.testNotFound = exports.matchDeepDynamicRouteName = exports.matchDynamicName = void 0;
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
/** Test `/` -> `page` */
function testNotFound(name) {
    return /\+not-found$/.test(name);
}
exports.testNotFound = testNotFound;
/** Match `(page)` -> `page` */
function matchGroupName(name) {
    return name.match(/^(?:[^\\(\\)])*?\(([^\\/]+)\).*?$/)?.[1];
}
exports.matchGroupName = matchGroupName;
/** Match `(a,b,c)/(d,c)` -> `[['a','b','c'], ['d','e']]` */
function matchArrayGroupName(name) {
    return name.match(/\(\s*\w[\w\s]*?,.*?\)/g)?.map((match) => match.slice(1, -1));
}
exports.matchArrayGroupName = matchArrayGroupName;
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
/**
 * Match:
 *  - _layout files, +html, +not-found, string+api, etc
 *  - Routes can still use `+`, but it cannot be in the last segment.
 */
function isTypedRoute(name) {
    return !name.startsWith('+') && name.match(/(_layout|[^/]*?\+[^/]*?)\.[tj]sx?$/) === null;
}
exports.isTypedRoute = isTypedRoute;
//# sourceMappingURL=matchers.js.map