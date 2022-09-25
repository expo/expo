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
export declare function preventAutoHideAsync(): Promise<boolean>;
/**
 * Hides the native splash screen immediately. Be careful to ensure that your app has content ready
 * to display when you hide the splash screen, or you may see a blank screen briefly. See the
 * ["Usage"](#usage) section for an example.
 */
export declare function hideAsync(): Promise<boolean>;
/**
 * @deprecated Use `SplashScreen.hideAsync()` instead
 * @ignore
 */
export declare function hide(): void;
/**
 * @deprecated Use `SplashScreen.preventAutoHideAsync()` instead
 * @ignore
 */
export declare function preventAutoHide(): void;
//# sourceMappingURL=SplashScreen.d.ts.map