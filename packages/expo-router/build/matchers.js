/** Match `[page]` -> `page` */
export function matchDynamicName(name) {
    // Don't match `...` or `[` or `]` inside the brackets
    // eslint-disable-next-line no-useless-escape
    return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1];
}
/** Match `[...page]` -> `page` */
export function matchDeepDynamicRouteName(name) {
    return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}
/** Test `/` -> `page` */
export function testNotFound(name) {
    return /\+not-found$/.test(name);
}
/** Match `(page)` -> `page` */
export function matchGroupName(name) {
    return name.match(/^(?:[^\\(\\)])*?\(([^\\/]+)\).*?$/)?.[1];
}
/** Match `(app)/(page)` -> `page` */
export function matchLastGroupName(name) {
    return name.match(/.*(?:\/|^)\(([^\\/\s]+)\)[^\s]*$/)?.[1];
}
/** Match the first array group name `(a,b,c)/(d,c)` -> `'a,b,c'` */
export function matchArrayGroupName(name) {
    return name.match(/(?:[^\\(\\)])*?\(([^\\/]+,[^\\/]+)\).*?$/)?.[1];
}
export function getNameFromFilePath(name) {
    return removeSupportedExtensions(removeFileSystemDots(name));
}
export function getContextKey(name) {
    // The root path is `` (empty string) so always prepend `/` to ensure
    // there is some value.
    const normal = '/' + getNameFromFilePath(name);
    if (!normal.endsWith('_layout')) {
        return normal;
    }
    return normal.replace(/\/?_layout$/, '');
}
/** Remove `.js`, `.ts`, `.jsx`, `.tsx` */
export function removeSupportedExtensions(name) {
    return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}
// Remove any amount of `./` and `../` from the start of the string
export function removeFileSystemDots(filePath) {
    return filePath.replace(/^(?:\.\.?\/)+/g, '');
}
export function stripGroupSegmentsFromPath(path) {
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
export function stripInvisibleSegmentsFromPath(path) {
    return stripGroupSegmentsFromPath(path).replace(/\/?index$/, '');
}
/**
 * Match:
 *  - _layout files, +html, +not-found, string+api, etc
 *  - Routes can still use `+`, but it cannot be in the last segment.
 */
export function isTypedRoute(name) {
    return !name.startsWith('+') && name.match(/(_layout|[^/]*?\+[^/]*?)\.[tj]sx?$/) === null;
}
//# sourceMappingURL=matchers.js.map