import { Appearance } from 'react-native';
import ExpoSystemUI from './ExpoSystemUI';
function NativeDynamicColor(name, scheme) {
    if (process.env.EXPO_OS === 'android') {
        return ExpoSystemUI.Material3DynamicColor(name, scheme);
    }
    return null;
}
export function Material3DynamicColor(name) {
    const scheme = Appearance.getColorScheme();
    return NativeDynamicColor(name, scheme ?? 'unspecified');
}
//# sourceMappingURL=Material3DynamicColor.js.map