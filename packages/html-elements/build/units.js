import { PixelRatio, Platform } from 'react-native';
const PIXELS_PER_INCH = 96;
const defaults = {
    ch: 8,
    ex: 7.15625,
    em: 16,
    rem: 16,
    in: PIXELS_PER_INCH,
    cm: PIXELS_PER_INCH / 2.54,
    mm: PIXELS_PER_INCH / 25.4,
    pt: PIXELS_PER_INCH / 72,
    pc: PIXELS_PER_INCH / 6,
    px: 1,
};
export function rem(pixels) {
    if (Platform.OS === 'web')
        return `${pixels}rem`;
    return PixelRatio.getFontScale() * defaults.rem * pixels;
}
export function em(pixels) {
    if (Platform.OS === 'web')
        return `${pixels}em`;
    return rem(pixels);
}
//# sourceMappingURL=units.js.map