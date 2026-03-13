"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTextStyleToRNTextStyle = convertTextStyleToRNTextStyle;
const react_native_1 = require("react-native");
function convertTextStyleToRNTextStyle(style) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(style);
    if (!flattenedStyle) {
        return undefined;
    }
    if ('fontWeight' in flattenedStyle) {
        return {
            ...flattenedStyle,
            fontWeight: typeof flattenedStyle.fontWeight === 'number'
                ? String(flattenedStyle.fontWeight)
                : flattenedStyle.fontWeight,
        };
    }
    return flattenedStyle;
}
//# sourceMappingURL=font.js.map