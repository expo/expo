import { PixelRatio, Platform, Dimensions } from 'react-native';
function invariant(value, methodName) {
    if (typeof value !== 'number')
        throw new TypeError(`${methodName} expected a number`);
}
export function rem(value) {
    invariant(value, 'rem');
    if (Platform.OS === 'web')
        return `${value}rem`;
    return PixelRatio.getFontScale() * 16 * value;
}
export function em(value) {
    invariant(value, 'em');
    if (Platform.OS === 'web')
        return `${value}em`;
    return rem(value);
}
export function px(value) {
    invariant(value, 'px');
    return value;
}
export function vw(value) {
    invariant(value, 'vw');
    if (Platform.OS === 'web')
        return `${value}vw`;
    const { width } = Dimensions.get('window');
    return width / (value * 0.01);
}
export function vh(value) {
    invariant(value, 'vh');
    if (Platform.OS === 'web')
        return `${value}vh`;
    const { height } = Dimensions.get('window');
    return height / (value * 0.01);
}
//# sourceMappingURL=units.js.map