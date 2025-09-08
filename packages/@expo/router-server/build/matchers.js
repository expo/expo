"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchDynamicName = matchDynamicName;
exports.testNotFound = testNotFound;
exports.matchGroupName = matchGroupName;
exports.matchLastGroupName = matchLastGroupName;
exports.matchArrayGroupName = matchArrayGroupName;
exports.getNameFromFilePath = getNameFromFilePath;
exports.getContextKey = getContextKey;
exports.removeSupportedExtensions = removeSupportedExtensions;
exports.removeFileSystemExtensions = removeFileSystemExtensions;
exports.removeFileSystemDots = removeFileSystemDots;
exports.stripGroupSegmentsFromPath = stripGroupSegmentsFromPath;
exports.stripInvisibleSegmentsFromPath = stripInvisibleSegmentsFromPath;
exports.isTypedRoute = isTypedRoute;
/** Match `[page]` -> `page` or `[...group]` -> `...group` */
const dynamicNameRe = /^\[([^[\]]+?)\]$/;
/** Match `[page]` -> `page` */
function matchDynamicName(name) {
    const paramName = name.match(dynamicNameRe)?.[1];
    if (paramName == null) {
        return undefined;
    }
    else if (paramName.startsWith('...')) {
        return { name: paramName.slice(3), deep: true };
    }
    else {
        return { name: paramName, deep: false };
    }
}
/** Test `/` -> `page` */
function testNotFound(name) {
    return /\+not-found$/.test(name);
}
/** Match `(page)` -> `page` */
function matchGroupName(name) {
    return name.match(/^(?:[^\\()])*?\(([^\\/]+)\)/)?.[1];
}
/** Match `(app)/(page)` -> `page` */
function matchLastGroupName(name) {
    return name.match(/.*(?:\/|^)\(([^\\/]+)\)[^\s]*$/)?.[1];
}
/** Match the first array group name `(a,b,c)/(d,c)` -> `'a,b,c'` */
function matchArrayGroupName(name) {
    return name.match(/(?:[^\\()])*?\(([^\\/]+,[^\\/]+)\)/)?.[1];
}
function getNameFromFilePath(name) {
    return removeSupportedExtensions(removeFileSystemDots(name));
}
function getContextKey(name) {
    // The root path is `` (empty string) so always prepend `/` to ensure
    // there is some value.
    const normal = '/' + getNameFromFilePath(name);
    if (!normal.endsWith('_layout')) {
        return normal;
    }
    return normal.replace(/\/?_layout$/, '');
}
/** Remove `.js`, `.ts`, `.jsx`, `.tsx`, and the +api suffix */
function removeSupportedExtensions(name) {
    return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}
/** Remove `.js`, `.ts`, `.jsx`, `.tsx` */
function removeFileSystemExtensions(name) {
    return name.replace(/\.[jt]sx?$/g, '');
}
// Remove any amount of `./` and `../` from the start of the string
function removeFileSystemDots(filePath) {
    return filePath.replace(/^(?:\.\.?\/)+/g, '');
}
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
function stripInvisibleSegmentsFromPath(path) {
    return stripGroupSegmentsFromPath(path).replace(/\/?index$/, '');
}
/**
 * Match:
 *  - _layout files, +html, +not-found, string+api, etc
 *  - Routes can still use `+`, but it cannot be in the last segment.
 */
function isTypedRoute(name) {
    return !name.startsWith('+') && name.match(/(_layout|[^/]*?\+[^/]*?)\.[tj]sx?$/) === null;
}
//# sourceMappingURL=matchers.js.map