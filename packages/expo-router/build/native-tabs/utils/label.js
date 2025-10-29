"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLabelStylePropToObject = convertLabelStylePropToObject;
function convertLabelStylePropToObject(labelStyle) {
    if (labelStyle) {
        if (typeof labelStyle === 'object' && ('default' in labelStyle || 'selected' in labelStyle)) {
            return labelStyle;
        }
        return {
            default: labelStyle,
        };
    }
    return {};
}
//# sourceMappingURL=label.js.map