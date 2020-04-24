import { ParsedURL, QueryParams } from './Linking.types';
/**
 * Create a URL that works for the environment the app is currently running in.
 * The scheme in bare and standalone must be defined in the app.json under `expo.scheme`.
 *
 * **Examples**
 *
 * - Bare, Standalone: yourscheme://
 * - Web (dev): https://localhost:19006/
 * - Web (prod): https://myapp.com/
 * - Expo Client (dev): exp://128.0.0.1:19000/--/
 * - Expo Client (prod): exp://exp.host/@yourname/your-app/
 * - Expo Client (prod): exp://exp.host/@yourname/your-app/
 *
 * @param path addition path components to append to the base URL.
 * @param queryParams An object of parameters that will be converted into a query string.
 */
export declare function makeUrl(path?: string, queryParams?: QueryParams): string;
/**
 * Returns the components and query parameters for a given URL.
 *
 * @param url Input URL to parse
 */
export declare function parse(url: string): ParsedURL;
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
declare const addEventListener: (type: string, handler: (event: {
    url: string;
}) => void) => void, removeEventListener: (type: string, handler: (event: {
    url: string;
}) => void) => void;
export { addEventListener, removeEventListener };
