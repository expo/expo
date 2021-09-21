import { Localization } from './Localization.types';
export { Localization };
/**
 * Three-character ISO 4217 currency code. Returns `null` on web.
 *
 * @example `'USD'`, `'EUR'`, `'CNY'`, `null`
 */
export declare const currency: string | null;
/**
 * Decimal separator used for formatting numbers.
 *
 * @example `','`, `'.'`
 */
export declare const decimalSeparator: string;
/**
 * Digit grouping separator used when formatting numbers larger than 1000.
 *
 * @example `'.'`, `''`, `','`
 */
export declare const digitGroupingSeparator: string;
/**
 * A list of all the supported language ISO codes.
 */
export declare const isoCurrencyCodes: string[];
/**
 * Boolean value that indicates whether the system uses the metric system.
 * On Android and web, this is inferred from the current region.
 */
export declare const isMetric: boolean;
/**
 * Returns if the system's language is written from Right-to-Left.
 * This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).
 *
 * Returns `false` in Server Side Rendering (SSR) environments.
 */
export declare const isRTL: boolean;
/**
 * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag),
 * consisting of a two-character language code and optional script, region and variant codes.
 *
 * @example `'en'`, `'en-US'`, `'zh-Hans'`, `'zh-Hans-CN'`, `'en-emodeng'`
 */
export declare const locale: string;
/**
 * List of all the native languages provided by the user settings.
 * These are returned in the order the user defines in their device settings.
 */
export declare const locales: string[];
/**
 * The current time zone in display format.
 * On Web time zone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a
 * better estimation you could use the moment-timezone package but it will add significant bloat to
 * your website's bundle size.
 *
 * @example `'America/Los_Angeles'`
 */
export declare const timezone: string;
/**
 * The region code for your device that comes from the Region setting under Language & Region on iOS.
 * This value is always available on iOS, but might return `null` on Android or web.
 *
 * @example `'US'`, `'NZ'`, `null`
 */
export declare const region: string | null;
/**
 * Get the latest native values from the device. Locale can be changed on some Android devices
 * without resetting the app.
 * > On iOS, changing the locale will cause the device to reset meaning the constants will always be
 * correct.
 *
 * @example
 * ```ts
 * // When the app returns from the background on Android...
 *
 * const { locale } = await Localization.getLocalizationAsync();
 * ```
 */
export declare function getLocalizationAsync(): Promise<Localization>;
