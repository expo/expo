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
/** Match `(page)` -> `page` */
export function matchGroupName(name) {
    return name.match(/^\(([^/]+?)\)$/)?.[1];
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
    return name.replace(/\.[jt]sx?$/g, '');
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
//# sourceMappingURL=matchers.js.map