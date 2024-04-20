// @needsAudit
export type Localization = {
  /**
   * Three-character ISO 4217 currency code. Returns `null` on web.
   * @example
   * `'USD'`, `'EUR'`, `'CNY'`, `null`
   */
  currency: string | null;
  /**
   * Decimal separator used for formatting numbers.
   * @example
   * `','`, `'.'`
   */
  decimalSeparator: string;
  /**
   * Digit grouping separator used when formatting numbers larger than 1000.
   * @example
   * `'.'`, `''`, `','`
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
   * @example
   * `'en'`, `'en-US'`, `'zh-Hans'`, `'zh-Hans-CN'`, `'en-emodeng'`
   */
  locale: string;
  /**
   * List of all the native languages provided by the user settings.
   * These are returned in the order that the user defined in the device settings.
   * @example
   * `['en', 'en-US', 'zh-Hans', 'zh-Hans-CN', 'en-emodeng']`
   */
  locales: string[];
  /**
   * The region code for your device that comes from the Region setting under Language & Region on iOS.
   * This value is always available on iOS, but might return `null` on Android or web.
   * @example
   * `'US'`, `'NZ'`, `null`
   */
  region: string | null;
  /**
   * The current time zone in display format.
   * On Web time zone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a
   * better estimation you could use the moment-timezone package but it will add significant bloat to
   * your website's bundle size.
   * @example
   * `'America/Los_Angeles'`
   */
  timezone: string;
};

export type Locale = {
  /**
   * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag) with a region code.
   * @example
   * `'en-US'`, `'es-419'`, `'pl-PL'`.
   */
  languageTag: string;
  /**
   * An [IETF BCP 47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag) without the region code.
   * @example
   * `'en'`, `'es'`, `'pl'`.
   */
  languageCode: string | null;
  /**
   * The region code for your device that comes from the Region setting under Language & Region on iOS, Region settings on Android and is parsed from locale on Web (can be `null` on Web).
   */
  regionCode: string | null;
  /**
   * Currency code for the locale.
   * Is `null` on Web, use a table lookup based on region instead.
   * @example
   * `'USD'`, `'EUR'`, `'PLN'`.
   */
  currencyCode: string | null;
  /**
   * Currency symbol for the locale.
   * Is `null` on Web, use a table lookup based on region (if available) instead.
   * @example
   * `'$'`, `'€'`, `'zł'`.
   */
  currencySymbol: string | null;
  /**
   * Decimal separator used for formatting numbers with fractional parts.
   * @example
   * `'.'`, `','`.
   */
  decimalSeparator: string | null;
  /**
   * Digit grouping separator used for formatting large numbers.
   * @example
   * `'.'`, `','`.
   */
  digitGroupingSeparator: string | null;
  /**
   * Text direction for the locale. One of: `'ltr'`, `'rtl'`, but can also be `null` on some browsers without support for the [textInfo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/textInfo) property in [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) API.
   */
  textDirection: 'ltr' | 'rtl' | null;
  /**
   * The measurement system used in the locale.
   * Is `null` on Web, as user chosen measurement system is not exposed on the web and using locale to determine measurement systems is unreliable.
   * Ask for user preferences if possible.
   */
  measurementSystem: `metric` | `us` | `uk` | null;
  /**
   * The temperature unit used in the locale.
   * Returns `null` if the region code is unknown.
   */
  temperatureUnit: 'celsius' | 'fahrenheit' | null;
};

/**
 * An enum mapping days of the week in Gregorian calendar to their index as returned by the `firstWeekday` property.
 */
export enum Weekday {
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 3,
  WEDNESDAY = 4,
  THURSDAY = 5,
  FRIDAY = 6,
  SATURDAY = 7,
}

/**
 * The calendar identifier, one of [Unicode calendar types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/calendar).
 * Gregorian calendar is aliased and can be referred to as both `CalendarIdentifier.GREGORIAN` and `CalendarIdentifier.GREGORY`.
 */
export enum CalendarIdentifier {
  /** Thai Buddhist calendar */
  BUDDHIST = 'buddhist',
  /** Traditional Chinese calendar */
  CHINESE = 'chinese',
  /** Coptic calendar */
  COPTIC = 'coptic',
  /** Traditional Korean calendar */
  DANGI = 'dangi',
  /** Ethiopic calendar, Amete Alem (epoch approx. 5493 B.C.E) */
  ETHIOAA = 'ethioaa',
  /** Ethiopic calendar, Amete Mihret (epoch approx, 8 C.E.) */
  ETHIOPIC = 'ethiopic',
  /** Gregorian calendar */
  GREGORY = 'gregory',
  /** Gregorian calendar (alias) */
  GREGORIAN = 'gregory',
  /** Traditional Hebrew calendar */
  HEBREW = 'hebrew',
  /** Indian calendar */
  INDIAN = 'indian',
  /** Islamic calendar */
  ISLAMIC = 'islamic',
  /** Islamic calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - civil epoch) */
  ISLAMIC_CIVIL = 'islamic-civil',
  /** Islamic calendar, Saudi Arabia sighting */
  ISLAMIC_RGSA = 'islamic-rgsa',
  /**Islamic calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - astronomical epoch) */
  ISLAMIC_TBLA = 'islamic-tbla',
  /** Islamic calendar, Umm al-Qura */
  ISLAMIC_UMALQURA = 'islamic-umalqura',
  /** ISO calendar (Gregorian calendar using the ISO 8601 calendar week rules) */
  ISO8601 = 'iso8601',
  /** Japanese imperial calendar */
  JAPANESE = 'japanese',
  /** Persian calendar */
  PERSIAN = 'persian',
  /** Civil (algorithmic) Arabic calendar */
  ROC = 'roc',
}

export type Calendar = {
  /**
   * The calendar identifier, one of [Unicode calendar types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/calendar).
   *
   * On Android is limited to one of device's [available calendar types](https://developer.android.com/reference/java/util/Calendar#getAvailableCalendarTypes()).
   *
   * On iOS uses [calendar identifiers](https://developer.apple.com/documentation/foundation/calendar/identifier), but maps them to the corresponding Unicode types, will also never contain `'dangi'` or `'islamic-rgsa'` due to it not being implemented on iOS.
   */
  calendar: CalendarIdentifier | null;
  /**
   * True when current device settings use 24-hour time format.
   * Can be null on some browsers that don't support the [hourCycle](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/hourCycle) property in [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) API.
   */
  uses24hourClock: boolean | null;
  /**
   * The first day of the week. For most calendars Sunday is numbered `1`, with Saturday being number `7`.
   * Can be null on some browsers that don't support the [weekInfo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/weekInfo) property in [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) API.
   * @example
   * `1`, `7`.
   */
  firstWeekday: Weekday | null;
  /**
   * Time zone for the calendar. Can be `null` on Web.
   * @example
   * `'America/Los_Angeles'`, `'Europe/Warsaw'`, `'GMT+1'`.
   */
  timeZone: string | null;
};
