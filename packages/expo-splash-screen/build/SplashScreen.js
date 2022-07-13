import { UnavailabilityError } from 'expo-modules-core';
import ExpoSplashScreen from './ExpoSplashScreen';
// @needsAudit
/**
 * Makes the native splash screen (configured in `app.json`) remain visible until `hideAsync` is called.
 *
 * > **Important note**: It is recommended to call this in global scope without awaiting, rather than
 * > inside React components or hooks, because otherwise this might be called too late,
 * > when the splash screen is already hidden.
 *
 * @example
 * ```ts
 * import * as SplashScreen from 'expo-splash-screen';
 *
 * SplashScreen.preventAutoHideAsync();
 *
 * export default function App() {
 *  // ...
 * }
 * ```
 */
export async function preventAutoHideAsync() {
    if (!ExpoSplashScreen.preventAutoHideAsync) {
        throw new UnavailabilityError('expo-splash-screen', 'preventAutoHideAsync');
    }
    return await ExpoSplashScreen.preventAutoHideAsync();
}
// @needsAudit
/**
 * Hides the native splash screen immediately. Be careful to ensure that your app has content ready
 * to display when you hide the splash screen, or you may see a blank screen briefly. See the
 * ["Usage"](#usage) section for an example.
 */
export async function hideAsync() {
    if (!ExpoSplashScreen.hideAsync) {
        throw new UnavailabilityError('expo-splash-screen', 'hideAsync');
    }
    return await ExpoSplashScreen.hideAsync();
}
/**
 * @deprecated Use `SplashScreen.hideAsync()` instead
 * @ignore
 */
export function hide() {
    console.warn('SplashScreen.hide() is deprecated in favour of SplashScreen.hideAsync()');
    hideAsync();
}
/**
 * @deprecated Use `SplashScreen.preventAutoHideAsync()` instead
 * @ignore
 */
export function preventAutoHide() {
    console.warn('SplashScreen.preventAutoHide() is deprecated in favour of SplashScreen.preventAutoHideAsync()');
    preventAutoHideAsync();
}
//# sourceMappingURL=SplashScreen.js.map