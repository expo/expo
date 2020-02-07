import { PixelRatio, Platform } from 'react-native';
export function rem(pixels) {
    if (Platform.OS === 'web')
        return `${pixels}rem`;
    return PixelRatio.getFontScale() * 16 * pixels;
}
export function em(pixels) {
    if (Platform.OS === 'web')
        return `${pixels}em`;
    return rem(pixels);
}
//# sourceMappingURL=units.js.map