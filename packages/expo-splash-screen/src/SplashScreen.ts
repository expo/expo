// @needsAudit

import type { SplashScreenOptions } from './SplashScreen.types';

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
export async function preventAutoHideAsync(): Promise<boolean> {
  return false;
}

/**
 *
 * Configures the splashscreens default animation behavior.
 *
 */
export function setOptions(options: SplashScreenOptions): void {}

// @needsAudit
/**
 * Hides the native splash screen immediately. Be careful to ensure that your app has content ready
 * to display when you hide the splash screen, or you may see a blank screen briefly. See the
 * ["Usage"](#usage) section for an example.
 */
export function hide(): void {}

/**
 * Hides the native splash screen immediately. This method is provided for backwards compatibility. See the
 * ["Usage"](#usage) section for an example.
 */
export async function hideAsync(): Promise<void> {}

/**
 * Stores the screen currently on display as the launch screen for the next app start. With the
 * splash screen prerender enabled, the screen that replaces the splash is captured automatically;
 * call this when the first screen changes while the app runs (after signing in or out, switching
 * theme or locale) so the next launch already shows the right one.
 * Resolves to `true` when a snapshot was taken.
 * @platform ios
 */
export async function saveLaunchScreenAsync(): Promise<boolean> {
  return false;
}

/**
 * Removes a stored launch screen snapshot. The next launch prerenders the bundled template.
 * @platform ios
 */
export async function clearLaunchScreenAsync(): Promise<void> {}
