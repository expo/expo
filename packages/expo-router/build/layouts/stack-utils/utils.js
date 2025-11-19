"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildOfType = isChildOfType;
exports.getFirstChildOfType = getFirstChildOfType;
exports.convertTextStyleToRNTextStyle = convertTextStyleToRNTextStyle;
const react_1 = require("react");
const react_native_1 = require("react-native");
function isChildOfType(element, type) {
    return (0, react_1.isValidElement)(element) && element.type === type;
}
function getFirstChildOfType(children, type) {
    return react_1.Children.toArray(children).find((child) => isChildOfType(child, type));
}
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
//# sourceMappingURL=utils.js.map