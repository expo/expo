import { StyleSheet } from 'react-native';
export function convertTextStyleToRNTextStyle(style) {
    const flattenedStyle = StyleSheet.flatten(style);
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