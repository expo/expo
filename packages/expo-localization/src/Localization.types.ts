// @needsAudit
export type Localization = {
  /**
   * Three-character ISO 4217 currency code. Returns `null` on web.
   *
   * @example `'USD'`, `'EUR'`, `'CNY'`, `null`
   */
  currency: string | null;
  /**
   * Decimal separator used for formatting numbers.
   *
   * @example `','`, `'.'`
   */
  decimalSeparator: string;
  /**
   * Digit grouping separator used when formatting numbers larger than 1000.
   *
   * @example `'.'`, `''`, `','`
   */
  digitGroupingSeparator: string;
  /**
   * A list of all the supported language ISO codes.
   */
  isoCurrencyCodes: string[];
  /**
   * Boolean value that indicates whether the system uses the metric system.
   * On Android and web, this is inferred from the current region.
   */
  isMetric: boolean;
  /**
   * Returns if the system's language is written from Right-to-Left.
   * This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).
   *
   * Returns `false` in Server Side Rendering (SSR) environments.
   */
  isRTL: boolean;
  /**
   * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag),
   * consisting of a two-character language code and optional script, region and variant codes.
   *
   * @example `'en'`, `'en-US'`, `'zh-Hans'`, `'zh-Hans-CN'`, `'en-emodeng'`
   */
  locale: string;
  /**
   * List of all the native languages provided by the user settings.
   * These are returned in the order that the user defined in the device settings.
   *
   * @example `['en', 'en-US', 'zh-Hans', 'zh-Hans-CN', 'en-emodeng']`
   */
  locales: string[];
  /**
   * The region code for your device that comes from the Region setting under Language & Region on iOS.
   * This value is always available on iOS, but might return `null` on Android or web.
   *
   * @example `'US'`, `'NZ'`, `null`
   */
  region: string | null;
  /**
   * The current time zone in display format.
   * On Web time zone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a
   * better estimation you could use the moment-timezone package but it will add significant bloat to
   * your website's bundle size.
   *
   * @example `'America/Los_Angeles'`
   */
  timezone: string;
  getPreferredLocales: () => PreferredLocale[];
  getPreferredCalendars: () => PreferredCalendar[];
};

export type PreferredLocale = {
  /**
   * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag) with a region code. Example: `en-US`, "es-419", "pl-PL".
   */
  languageTag: string;
  /**
   * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag) without the region code. Example: `en`, "es", "pl".
   */
  languageCode: string;
  /**
   * The region code for your device that comes from the Region setting under Language & Region on iOS, Region settings on android and is parsed from locale on web (can be null on web).
   */
  regionCode: string | null;
  /**
   * Currency code for the locale. Example: `USD`, "EUR", "PLN".
   * Returns `null` on web, use a table lookup based on region instead.
   */
  currencyCode: string | null;
  /**
   * Currency symbol for the locale. Example: `$`, "€", "zł".
   * Returns `null` on web, use a table lookup based on region (if available) instead.
   */
  currencySymbol: string | null;
  /**
   * Decimal separator used for formatting numbers with fractional parts. Example: `.`, `,`.
   */
  decimalSeparator: string | null;
  /**
   * Digit grouping separator used for formatting large numbers. Example: `.`, `,`.
   */
  digitGroupingSeparator: string | null;
  /**
   * Text direction for the locale. One of: `ltr`, `rtl`, but can also be null on older browsers without support for the textInfo API.
   */
  textDirection: 'ltr' | 'rtl' | null;
  /**
   * The measurement system used in the locale. On iOS is one of `metric`, `us`. On android is one of `metric`, `us`, `uk`.
   * Returns `null` on web, as user chosen measurement system is not exposed on the web and using locale to determine measurement is unreliable.
   * Ask for user preferences if possible.
   */
  measurementSystem: `metric` | `us` | `uk` | null;
};

export type PreferredCalendar = {
  /**
   * The calendar identifier.
   * On web returns one of [Unicode calendar types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/calendar).
   * Example: `gregory`, `chinese`, `islamic`.
   *
   * On android can return one of device's [available calendar types](https://developer.android.com/reference/java/util/Calendar#getAvailableCalendarTypes()).
   * Should overlap with Unicode calendar types.
   * Example: `gregory`, `chinese`, `islamic`.
   *
   * On iOS can return one of [calendar identifiers](https://developer.apple.com/documentation/foundation/calendar/identifier). Example: `gregorian`, `buddist`.
   */
  calendar: string | null;
  /**
   * True when current device settings use 24 hour time format.
   * Can be null on older browsers that don't support the `hourCycle` API.
   * Is one of: `true`, `false`.
   */
  uses24hourClock: boolean | null;
  /**
   * The first day of the week. For a Gregorian calendar Sunday is numbered 1, with Monday being number 7.
   * Can be null on older browsers that don't support the `weekInfo` API.
   * Example: `1`, `7`, `9` (for non-Gregorian calendars).
   */
  firstWeekday: number | null;
  /**
   * Time zone for the calendar. Can be null on web.
   * Example: `America/Los_Angeles`, `Europe/Warsaw`, `GMT+1`.
   */
  timeZone: string | null;
};
