import { CreateURLOptions, ParsedURL, QueryParams, SendIntentExtras, URLListener } from './Linking.types';
/**
 * Create a URL that works for the environment the app is currently running in.
 * The scheme in bare and standalone must be defined in the app.json under `expo.scheme`.
 *
 * # Examples
 * - Bare: empty string
 * - Standalone, Custom: `yourscheme:///path`
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Client (dev): `exp://128.0.0.1:19000/--/path`
 * - Expo Client (prod): `exp://exp.host/@yourname/your-app/--/path`
 *
 * @param path addition path components to append to the base URL.
 * @param queryParams An object with a set of query parameters. These will be merged with any
 * Expo-specific parameters that are needed (e.g. release channel) and then appended to the URL
 * as a query string.
 * @param scheme Optional URI protocol to use in the URL `<scheme>:///`, when `undefined` the scheme
 * will be chosen from the Expo config (`app.config.js` or `app.json`).
 * @return A URL string which points to your app with the given deep link information.
 * @deprecated An alias for [`createURL()`](#linkingcreateurlpath-namedparameters). This method is
 * deprecated and will be removed in a future SDK version.
 */
export declare function makeUrl(path?: string, queryParams?: QueryParams, scheme?: string): string;
/**
 * Helper method for constructing a deep link into your app, given an optional path and set of query
 * parameters. Creates a URI scheme with two slashes by default.
 *
 * The scheme in bare and standalone must be defined in the Expo config (`app.config.js` or `app.json`)
 * under `expo.scheme`.
 *
 * # Examples
 * - Bare: `<scheme>://path` - uses provided scheme or scheme from Expo config `scheme`.
 * - Standalone, Custom: `yourscheme://path`
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Client (dev): `exp://128.0.0.1:19000/--/path`
 * - Expo Client (prod): `exp://exp.host/@yourname/your-app/--/path`
 *
 * @param path Addition path components to append to the base URL.
 * @param namedParameters Additional options object.
 * @return A URL string which points to your app with the given deep link information.
 */
export declare function createURL(path: string, { scheme, queryParams, isTripleSlashed }?: CreateURLOptions): string;
/**
 * Helper method for parsing out deep link information from a URL.
 * @param url A URL that points to the currently running experience (e.g. an output of `Linking.createURL()`).
 * @return A `ParsedURL` object.
 */
export declare function parse(url: string): ParsedURL;
/**
 * Add a handler to `Linking` changes by listening to the `url` event type and providing the handler.
 * It is recommended to use the [`useURL()`](#useurl) hook instead.
 * @param type The only valid type is `'url'`.
 * @param handler An [`URLListener`](#urllistener) function that takes an `event` object of the type
 * [`EventType`](#eventype).
 * @see [React Native Docs Linking page](https://reactnative.dev/docs/linking#addeventlistener).
 */
export declare function addEventListener(type: string, handler: URLListener): void;
/**
 * Remove a handler by passing the `url` event type and the handler.
 * @param type The only valid type is `'url'`.
 * @param handler An [`URLListener`](#urllistener) function that takes an `event` object of the type
 * [`EventType`](#eventype).
 * @see [React Native Docs Linking page](https://reactnative.dev/docs/linking#removeeventlistener).
 */
export declare function removeEventListener(type: string, handler: URLListener): void;
/**
 * Helper method which wraps React Native's `Linking.getInitialURL()` in `Linking.parse()`.
 * Parses the deep link information out of the URL used to open the experience initially.
 * If no link opened the app, all the fields will be `null`.
 * > On the web it parses the current window URL.
 * @return A promise that resolves with `ParsedURL` object.
 */
export declare function parseInitialURLAsync(): Promise<ParsedURL>;
/**
 * Launch an Android intent with extras.
 * > Use [IntentLauncher](../intent-launcher) instead, `sendIntent` is only included in
 * > `Linking` for API compatibility with React Native's Linking API.
 * @platform android
 */
export declare function sendIntent(action: string, extras?: SendIntentExtras[]): Promise<void>;
/**
 * Open the operating system settings app and displays the app’s custom settings, if it has any.
 * @platform ios
 */
export declare function openSettings(): Promise<void>;
/**
 * Get the URL that was used to launch the app if it was launched by a link.
 * @return The URL string that launched your app, or `null`.
 */
export declare function getInitialURL(): Promise<string | null>;
/**
 * Attempt to open the given URL with an installed app. See the [Linking guide](/guides/linking)
 * for more information.
 * @param url A URL for the operating system to open, eg: `tel:5555555`, `exp://`.
 * @return A `Promise` that is fulfilled with `true` if the link is opened operating system
 * automatically or the user confirms the prompt to open the link. The `Promise` rejects if there
 * are no applications registered for the URL or the user cancels the dialog.
 */
export declare function openURL(url: string): Promise<true>;
/**
 * Determine whether or not an installed app can handle a given URL.
 * On web this always returns `true` because there is no API for detecting what URLs can be opened.
 * @param url The URL that you want to test can be opened.
 * @return A `Promise` object that is fulfilled with `true` if the URL can be handled, otherwise it
 * `false` if not.
 *
 * The `Promise` will reject on Android if it was impossible to check if the URL can be opened, and
 * on iOS if you didn't [add the specific scheme in the `LSApplicationQueriesSchemes` key inside **Info.plist**](/guides/linking#opening-links-to-other-apps).
 */
export declare function canOpenURL(url: string): Promise<boolean>;
/**
 * Returns the initial URL followed by any subsequent changes to the URL.
 * @return Returns the initial URL or `null`.
 */
export declare function useURL(): string | null;
export * from './Linking.types';
