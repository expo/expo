import ExpoLocalization from './ExpoLocalization';
import { Localization } from './Localization.types';

export { Localization };

// Web, Android, and some iOS values use `-`. This will convert the iOS values that use `_`
// https://github.com/expo/expo/blob/21ae94bae2e8369992050c433a00699d425b35bd/packages/expo/src/Localization.ts#L112-L114
const parseLocale = (locale: string): string => locale.replace('_', '-');

/**
 * Three character ISO 4217 currency code. Returns `null` on web.
 *
 * @example `USD`, `EUR`, `CNY`, null
 */
export const currency = ExpoLocalization.currency;

/**
 * Decimal separator used for formatting numbers.
 *
 * @example `,`, '.'
 */
export const decimalSeparator = ExpoLocalization.decimalSeparator;

/**
 * Grouping separator used when formatting numbers larger than 1000.
 *
 * @example `.`, '', ','
 */
export const groupingSeparator = ExpoLocalization.groupingSeparator;

/**
 * A list of all the supported language ISO codes.
 */
export const isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;

/**
 * Boolean value that indicates whether the system uses the metric system.
 */
export const isMetric = ExpoLocalization.isMetric;

/**
 * Returns if the system's language is written from Right-to-Left.
 * This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).
 *
 * Returns `false` in Server Side Rendering (SSR) environments.
 */
export const isRTL = ExpoLocalization.isRTL;

/**
 * Device locale (Unicode BCP 47 identifier), consisting of a language-code and optional script, region and variant codes.
 *
 * @example `en`, `en-US`, `zh-Hans`, `zh-Hans-CN`, `en-emodeng`
 */
export const locale = parseLocale(ExpoLocalization.locale);

/**
 * List of all the native languages provided by the user settings.
 * These are returned in the order the user defines in their native settings.
 */
export const locales = ExpoLocalization.locales.map(parseLocale);

/**
 * The current timezone in display format.
 * On Web timezone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a better estimation you could use the moment-timezone package but it will add significant bloat to your website's bundle size.
 *
 * @example `America/Los_Angeles`
 */
export const timezone = ExpoLocalization.timezone;

/**
 * Region code for your device which came from Region setting in Language & Region.
 * This value is always available on iOS, but might return `null` on Android or web.
 *
 * @example `US`, `NZ`, null
 */
export const region = ExpoLocalization.region;

/**
 * Get the latest native values from the device.
 * Locale can be changed on some Android devices without resetting the app.
 * On iOS, changing the locale will cause the device to reset meaning the constants will always be correct.
 */
export async function getLocalizationAsync(): Promise<Localization> {
  const { locale, locales, ...localization } = await ExpoLocalization.getLocalizationAsync();
  return {
    locale: parseLocale(locale),
    locales: ExpoLocalization.locales.map(parseLocale),
    ...localization,
  };
}
