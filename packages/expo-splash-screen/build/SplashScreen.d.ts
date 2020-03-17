/**
 * Makes the native splash screen stay visible until `SplashScreen.hideAsync()` is called.
 * It has to be celled before any view is rendered.
 *
 * @example
 * ```typescript
 * // top level component
 *
 * SplashScreen.preventAutoHideAsync()
 *  .catch(error => console.log(`SplashScreen.preventAutoHideAsync error: ${error}`));
 *
 * class App extends React.Component {
 *   ...
 *   // Hide SplashScreen once your app content is ready to be displayed.
 *   SplashScreen.hideAsync()
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
