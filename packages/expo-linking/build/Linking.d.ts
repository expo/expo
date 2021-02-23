import { ParsedURL, QueryParams, URLListener } from './Linking.types';
/**
 * Create a URL that works for the environment the app is currently running in.
 * The scheme in bare and standalone must be defined in the app.json under `expo.scheme`.
 *
 * **Examples**
 *
 * - Bare: empty string
 * - Standalone, Custom: `yourscheme:///path`
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Client (dev): `exp://128.0.0.1:19000/--/path`
 * - Expo Client (prod): `exp://exp.host/@yourname/your-app/--/path`
 *
 * @param path addition path components to append to the base URL.
 * @param queryParams An object of parameters that will be converted into a query string.
 */
export declare function makeUrl(path?: string, queryParams?: QueryParams, scheme?: string): string;
/**
 * Create a URL that works for the environment the app is currently running in.
 * The scheme in bare and standalone must be defined in the Expo config (app.config.js or app.json) under `expo.scheme`.
 *
 * **Examples**
 *
 * - Bare: `<scheme>://path` -- uses provided scheme or scheme from Expo config `scheme`.
 * - Standalone, Custom: `yourscheme://path`
 * - Web (dev): `https://localhost:19006/path`
 * - Web (prod): `https://myapp.com/path`
 * - Expo Client (dev): `exp://128.0.0.1:19000/--/path`
 * - Expo Client (prod): `exp://exp.host/@yourname/your-app/--/path`
 *
 * @param path addition path components to append to the base URL.
 * @param scheme URI protocol `<scheme>://` that must be built into your native app.
 * @param queryParams An object of parameters that will be converted into a query string.
 */
export declare function createURL(path: string, { scheme, queryParams, isTripleSlashed, }?: {
    scheme?: string;
    queryParams?: QueryParams;
    isTripleSlashed?: boolean;
}): string;
/**
 * Returns the components and query parameters for a given URL.
 *
 * @param url Input URL to parse
 */
export declare function parse(url: string): ParsedURL;
/**
 * Add a handler to Linking changes by listening to the `url` event type
 * and providing the handler
 *
 * See https://reactnative.dev/docs/linking.html#addeventlistener
 */
export declare function addEventListener(type: string, handler: URLListener): void;
/**
 * Remove a handler by passing the `url` event type and the handler.
 *
 * See https://reactnative.dev/docs/linking.html#removeeventlistener
 */
export declare function removeEventListener(type: string, handler: URLListener): void;
/**
 * **Native:** Parses the link that opened the app. If no link opened the app, all the fields will be \`null\`.
 * **Web:** Parses the current window URL.
 */
export declare function parseInitialURLAsync(): Promise<ParsedURL>;
/**
 * Launch an Android intent with optional extras
 *
 * @platform android
 */
export declare function sendIntent(action: string, extras?: {
    key: string;
    value: string | number | boolean;
}[]): Promise<void>;
/**
 * Attempt to open the system settings for an the app.
 *
 * @platform ios
 */
export declare function openSettings(): Promise<void>;
/**
 * If the app launch was triggered by an app link,
 * it will give the link url, otherwise it will give `null`
 */
export declare function getInitialURL(): Promise<string | null>;
/**
 * Try to open the given `url` with any of the installed apps.
 */
export declare function openURL(url: string): Promise<true>;
/**
 * Determine whether or not an installed app can handle a given URL.
 * On web this always returns true because there is no API for detecting what URLs can be opened.
 */
export declare function canOpenURL(url: string): Promise<boolean>;
/**
 * Returns the initial URL followed by any subsequent changes to the URL.
 */
export declare function useUrl(): string | null;
export * from './Linking.types';
