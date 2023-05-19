export function defaultCSSInterop(jsx, type, { className, ...props }, key) {
    if (typeof className === 'string') {
        const classNameStyle = { $$css: true, [className]: className };
        props.style = Array.isArray(props.style)
            ? [classNameStyle, ...props.style]
            : props.style
                ? [classNameStyle, props.style]
                : classNameStyle;
    }
    return jsx(type, props, key);
}
//# sourceMappingURL=css-interop.js.map