"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLabelStylePropToObject = convertLabelStylePropToObject;
const react_native_1 = require("react-native");
function convertLabelStylePropToObject(labelStyle) {
    if (labelStyle) {
        if (typeof labelStyle === 'object' && ('default' in labelStyle || 'selected' in labelStyle)) {
            return {
                default: labelStyle.default ? react_native_1.StyleSheet.flatten(labelStyle.default) : undefined,
                selected: labelStyle.selected ? react_native_1.StyleSheet.flatten(labelStyle.selected) : undefined,
            };
        }
        return {
            default: react_native_1.StyleSheet.flatten(labelStyle),
        };
    }
    return {};
}
//# sourceMappingURL=label.js.map