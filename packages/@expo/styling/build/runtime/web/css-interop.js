"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultCSSInterop = void 0;
function defaultCSSInterop(jsx, type, { className, ...props }, key) {
    if (typeof className === "string") {
        const classNameStyle = { $$css: true, [className]: className };
        props.style = Array.isArray(props.style)
            ? [classNameStyle, ...props.style]
            : props.style !== undefined
                ? [classNameStyle, props.style]
                : classNameStyle;
    }
    return jsx(type, props, key);
}
exports.defaultCSSInterop = defaultCSSInterop;
//# sourceMappingURL=css-interop.js.map