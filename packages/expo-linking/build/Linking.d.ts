import { EmitterSubscription } from 'react-native';
import { ParsedURL, SendIntentExtras, URLListener } from './Linking.types';
/**
 * Add a handler to `Linking` changes by listening to the `url` event type and providing the handler.
 * It is recommended to use the [`useURL()`](#useurl) hook instead.
 * @param type The only valid type is `'url'`.
 * @param handler An [`URLListener`](#urllistener) function that takes an `event` object of the type
 * [`EventType`](#eventtype).
 * @return An EmitterSubscription that has the remove method from EventSubscription
 * @see [React Native documentation on Linking](https://reactnative.dev/docs/linking#addeventlistener).
 */
export declare function addEventListener(type: 'url', handler: URLListener): EmitterSubscription;
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
 * > Use [`expo-intent-launcher`](./intent-launcher) instead. `sendIntent` is only included in
 * > `Linking` for API compatibility with React Native's Linking API.
 * @platform android
 */
export declare function sendIntent(action: string, extras?: SendIntentExtras[]): Promise<void>;
/**
 * Open the operating system settings app and displays the app’s custom settings, if it has any.
 */
export declare function openSettings(): Promise<void>;
/**
 * Get the URL that was used to launch the app if it was launched by a link.
 * @return The URL string that launched your app, or `null`.
 */
export declare function getInitialURL(): Promise<string | null>;
/**
 * Get the URL that was used to launch the app if it was launched by a link.
 * @return The URL string that launched your app, or `null`.
 */
export declare function getLinkingURL(): string | null;
/**
 * Attempt to open the given URL with an installed app. See the [Linking guide](/guides/linking)
 * for more information.
 * @param url A URL for the operating system to open. For example: `tel:5555555`, `exp://`.
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
 * The `Promise` will reject on Android if it was impossible to check if the URL can be opened, and
 * on iOS if you didn't [add the specific scheme in the `LSApplicationQueriesSchemes` key inside **Info.plist**](/guides/linking#linking-from-your-app).
 */
export declare function canOpenURL(url: string): Promise<boolean>;
/**
 * Returns the initial URL followed by any subsequent changes to the URL.
 * @return Returns the initial URL or `null`.
 */
export declare function useURL(): string | null;
/**
 * Returns the linking URL followed by any subsequent changes to the URL.
 * Always returns the initial URL immediately on reload.
 * @return Returns the initial URL or `null`.
 */
export declare function useLinkingURL(): string | null;
export * from './Linking.types';
export * from './Schemes';
export { parse, createURL } from './createURL';
//# sourceMappingURL=Linking.d.ts.map