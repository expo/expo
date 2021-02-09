import { PixelRatio, Platform } from 'react-native';
export function rem(value) {
    if (Platform.OS === 'web')
        return `${value}rem`;
    return PixelRatio.getFontScale() * 16 * value;
}
export function em(value) {
    if (Platform.OS === 'web')
        return `${value}em`;
    return rem(value);
}
//# sourceMappingURL=units.js.map