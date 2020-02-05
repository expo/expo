/**
 * Makes the native splash screen stay visible until `SplashScreen.hideAsync()` is called.
 * It has to ba celled before any View is created.
 *
 * @example
 * ```typescript
 * // top level component
 *
 * SplashScreen.preventAutoHideAsync()
 *  .then(() => console.log('SplashScreen.preventAutoHideAsync returned'))
 *  .catch(error => console.log(`SplashScreen.preventAutoHideAsync error: ${error}`));
 *
 * class App extends React.Component {
 *   ...
 *   SplashScreen.hideAsync()
 *    .then(() => console.log('SplashScreen.hideAsync returned'))
 *    .catch(error => console.log(`SplashScreen.hideAsync error: ${error}`));
 *   ...
 * }
 * ```
 */
export declare function preventAutoHideAsync(): Promise<any>;
export declare function hideAsync(): Promise<any>;
/**
 * @deprecated
 */
export declare function hide(): Promise<any>;
/**
 * @deprecated
 */
export declare function preventAutoHide(): Promise<any>;
