import { Appearance } from 'react-native';
import ExpoSystemUI from './ExpoSystemUI';
function NativeDynamicColor(name, scheme) {
    if (process.env.EXPO_OS === 'android') {
        return ExpoSystemUI.DynamicColor(name, scheme);
    }
    return null;
}
export function DynamicColor(name) {
    const scheme = Appearance.getColorScheme();
    if (scheme) {
        return NativeDynamicColor(name, scheme);
    }
    return null;
}
export function ContentBasedDynamicColor(name, base64Bitmap) {
    if (process.env.EXPO_OS === 'android') {
        return ExpoSystemUI.ContentBasedDynamicColor(name, base64Bitmap);
    }
    return null;
}
//# sourceMappingURL=DynamicColor.js.map