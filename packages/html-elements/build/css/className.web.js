export function withClassName(styles, className) {
    if (className) {
        if (!Array.isArray(styles)) {
            styles = [styles];
        }
        return [...styles, { $$css: true, _: className }];
    }
    return styles;
}
//# sourceMappingURL=className.web.js.map