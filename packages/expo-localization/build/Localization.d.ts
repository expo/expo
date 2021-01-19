import { Localization } from './Localization.types';
export { Localization };
/**
 * Three character ISO 4217 currency code. Returns `null` on web.
 *
 * @example `USD`, `EUR`, `CNY`, null
 */
export declare const currency: string | null;
/**
 * Decimal separator used for formatting numbers.
 *
 * @example `,`, '.'
 */
export declare const decimalSeparator: string;
/**
 * Grouping separator used when formatting numbers larger than 1000.
 *
 * @example `.`, '', ','
 */
export declare const groupingSeparator: string;
/**
 * A list of all the supported language ISO codes.
 */
export declare const isoCurrencyCodes: string[];
/**
 * Boolean value that indicates whether the system uses the metric system.
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
 * Device locale (Unicode BCP 47 identifier), consisting of a language-code and optional script, region and variant codes.
 *
 * @example `en`, `en-US`, `zh-Hans`, `zh-Hans-CN`, `en-emodeng`
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
 * Region code for your device which came from Region setting in Language & Region.
 * This value is always available on iOS, but might return `null` on Android or web.
 *
 * @example `US`, `NZ`, null
 */
export declare const region: string | null;
/**
 * Get the latest native values from the device.
 * Locale can be changed on some Android devices without resetting the app.
 * On iOS, changing the locale will cause the device to reset meaning the constants will always be correct.
 */
export declare function getLocalizationAsync(): Promise<Localization>;
