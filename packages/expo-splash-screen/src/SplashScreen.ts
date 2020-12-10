import { UnavailabilityError } from '@unimodules/core';

import ExpoSplashScreen from './ExpoSplashScreen';

/**
 * Makes the native splash screen stay visible until `SplashScreen.hideAsync()` is called.
 * It has to be called before any view is rendered.
 *
 * @example
 * ```typescript
 * // top level component
 *
 * SplashScreen.preventAutoHideAsync()
 *  .then(result => console.log(`SplashScreen.preventAutoHideAsync() succeeded: ${result}`))
 *  .catch(console.warn); // it's good to explicitly catch and inspect any error
 *
 * class App extends React.Component {
 *   ...
 *   // Hide SplashScreen once your app content is ready to be displayed.
 *   await SplashScreen.hideAsync()
 *   ...
 * }
 * ```
 */
export async function preventAutoHideAsync(): Promise<boolean> {
  if (!ExpoSplashScreen.preventAutoHideAsync) {
    throw new UnavailabilityError('expo-splash-screen', 'preventAutoHideAsync');
  }
  return await ExpoSplashScreen.preventAutoHideAsync();
}

export async function hideAsync(): Promise<boolean> {
  if (!ExpoSplashScreen.hideAsync) {
    throw new UnavailabilityError('expo-splash-screen', 'hideAsync');
  }
  return await ExpoSplashScreen.hideAsync();
}

/**
 * @deprecated Use `SplashScreen.hideAsync()` instead
 */
export function hide(): void {
  console.warn('SplashScreen.hide() is deprecated in favour of SplashScreen.hideAsync()');
  hideAsync();
}

/**
 * @deprecated Use `SplashScreen.preventAutoHideAsync()` instead
 */
export function preventAutoHide(): void {
  console.warn(
    'SplashScreen.preventAutoHide() is deprecated in favour of SplashScreen.preventAutoHideAsync()'
  );
  preventAutoHideAsync();
}
