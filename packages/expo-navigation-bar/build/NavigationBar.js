import { Platform } from 'react-native';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';
import ExpoNavigationBar from './ExpoNavigationBar';
// This line only imports the type information for TypeScript type checking.
// It doesn't import the actual module in the compiled JavaScript code. The actual
// module is imported conditionally with require() below, in order to avoid
// importing the module if edge-to-edge is not enabled (which could throw if
// it's not linked).
let SystemBars = null;
if (isEdgeToEdge() && Platform.OS === 'android') {
    SystemBars = require('react-native-edge-to-edge').SystemBars;
    if (!SystemBars) {
        throw new Error('Edge-to-edge has been enabled with `react-native-edge-to-edge`, but `SystemBars` failed to resolve. Make sure your project is configured correctly.');
    }
}
const canRunEdgeToEdgeMethods = SystemBars !== null;
// MARK: react-native-edge-to-edge based APIs
/**
 * Sets the style of the navigation bar.
 * > This will have an effect when the following conditions are met:
 * > - Edge-to-edge is enabled
 * > - The `enforceNavigationBarContrast` option of the `react-native-edge-to-edge` plugin is set to `false`.
 * > - The device is using the three-button navigation bar.
 *
 * > Due to a bug in the Android 15 emulator this function may have no effect. Try a physical device or an emulator with a different version of Android.
 *
 * @platform android
 */
export function setStyle(style) {
    if (!canRunEdgeToEdgeMethods && Platform.OS === 'android') {
        throw new Error('`setStyle` is only supported on Android when edge-to-edge is enabled. Enable edge-to-edge or use the `setButtonStyle` function instead.');
    }
    if (Platform.OS !== 'android') {
        console.warn('`setStyle` method is only available on Android');
        return;
    }
    SystemBars?.setStyle({ navigationBar: style });
}
/**
 * Set the navigation bar's visibility.
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 * @param visibility Based on CSS visibility property.
 * @platform android
 */
export async function setVisibilityAsync(visibility) {
    if (Platform.OS !== 'android') {
        console.warn('`setVisibilityAsync` is only available on Android');
        return;
    }
    if (canRunEdgeToEdgeMethods) {
        // We know the SystemBars module is available, but typescript doesn't interpret it, so we have to use optional.
        return SystemBars?.setHidden({ navigationBar: visibility === 'hidden' });
    }
    return await ExpoNavigationBar.setVisibilityAsync(visibility);
}
// MARK: existing expo-navigation-bar APIs
export * from './NativeNavigationBarWrapper';
export * from './NavigationBar.types';
//# sourceMappingURL=NavigationBar.js.map