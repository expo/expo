import ExpoLocalization from './ExpoLocalization';
// @needsAudit
/**
 * Three-character ISO 4217 currency code. Returns `null` on web.
 *
 * @example `'USD'`, `'EUR'`, `'CNY'`, `null`
 */
export const currency = ExpoLocalization.currency;
// @needsAudit
/**
 * Decimal separator used for formatting numbers.
 *
 * @example `','`, `'.'`
 */
export const decimalSeparator = ExpoLocalization.decimalSeparator;
// @needsAudit
/**
 * Digit grouping separator used when formatting numbers larger than 1000.
 *
 * @example `'.'`, `''`, `','`
 */
export const digitGroupingSeparator = ExpoLocalization.digitGroupingSeparator;
// @needsAudit
/**
 * A list of all the supported language ISO codes.
 */
export const isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
// @needsAudit
/**
 * Boolean value that indicates whether the system uses the metric system.
 * On Android and web, this is inferred from the current region.
 */
export const isMetric = ExpoLocalization.isMetric;
// @needsAudit
/**
 * Returns if the system's language is written from Right-to-Left.
 * This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).
 *
 * Returns `false` in Server Side Rendering (SSR) environments.
 */
export const isRTL = ExpoLocalization.isRTL;
// @needsAudit
/**
 * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag),
 * consisting of a two-character language code and optional script, region and variant codes.
 *
 * @example `'en'`, `'en-US'`, `'zh-Hans'`, `'zh-Hans-CN'`, `'en-emodeng'`
 */
export const locale = ExpoLocalization.locale;
// @needsAudit
/**
 * List of all the native languages provided by the user settings.
 * These are returned in the order the user defines in their device settings.
 */
export const locales = ExpoLocalization.locales;
// @needsAudit
/**
 * The current time zone in display format.
 * On Web time zone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a
 * better estimation you could use the moment-timezone package but it will add significant bloat to
 * your website's bundle size.
 *
 * @example `'America/Los_Angeles'`
 */
export const timezone = ExpoLocalization.timezone;
// @needsAudit
/**
 * The region code for your device that comes from the Region setting under Language & Region on iOS.
 * This value is always available on iOS, but might return `null` on Android or web.
 *
 * @example `'US'`, `'NZ'`, `null`
 */
export const region = ExpoLocalization.region;
// @needsAudit
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
export async function getLocalizationAsync() {
    return await ExpoLocalization.getLocalizationAsync();
}
//# sourceMappingURL=Localization.js.map