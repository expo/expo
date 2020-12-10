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
export declare function preventAutoHideAsync(): Promise<boolean>;
export declare function hideAsync(): Promise<boolean>;
/**
 * @deprecated Use `SplashScreen.hideAsync()` instead
 */
export declare function hide(): void;
/**
 * @deprecated Use `SplashScreen.preventAutoHideAsync()` instead
 */
export declare function preventAutoHide(): void;
