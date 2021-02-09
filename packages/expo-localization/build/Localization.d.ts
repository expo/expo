import { Localization } from './Localization.types';
export { Localization };
/**
 * Native device language, returned in standard format.
 *
 * @example `en`, `en-US`, `es-US`
 */
export declare const locale: string;
/**
 * List of all the native languages provided by the user settings.
 * These are returned in the order the user defines in their native settings.
 */
export declare const locales: string[];
/**
 * The current timezone in display format.
 * On Web timezone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a better estimation you could use the moment-timezone package but it will add significant bloat to your website's bundle size.
 *
 * @example `America/Los_Angeles`
 */
export declare const timezone: string;
/**
 * A list of all the supported language ISO codes.
 */
export declare const isoCurrencyCodes: string[];
/**
 * **Available on iOS and web**: Region code for your device which came from Region setting in Language & Region.
 *
 * @example `US`, `NZ`
 */
export declare const region: string | null;
/**
 * Returns if the system's language is written from Right-to-Left.
 * This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).
 *
 * Returns `false` in Server Side Rendering (SSR) environments.
 */
export declare const isRTL: boolean;
/**
 * Get the latest native values from the device.
 * Locale can be changed on some Android devices without resetting the app.
 * On iOS, changing the locale will cause the device to reset meaning the constants will always be correct.
 */
export declare function getLocalizationAsync(): Promise<Localization>;
