export function getHeaderTitle(options, fallback) {
    return typeof options.headerTitle === 'string'
        ? options.headerTitle
        : options.title !== undefined
            ? options.title
            : fallback;
}
//# sourceMappingURL=getHeaderTitle.js.map