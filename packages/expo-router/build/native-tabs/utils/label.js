import { StyleSheet } from 'react-native';
export function convertLabelStylePropToObject(labelStyle) {
    if (labelStyle) {
        if (typeof labelStyle === 'object' && ('default' in labelStyle || 'selected' in labelStyle)) {
            return {
                default: labelStyle.default ? StyleSheet.flatten(labelStyle.default) : undefined,
                selected: labelStyle.selected ? StyleSheet.flatten(labelStyle.selected) : undefined,
            };
        }
        return {
            default: StyleSheet.flatten(labelStyle),
        };
    }
    return {};
}
//# sourceMappingURL=label.js.map