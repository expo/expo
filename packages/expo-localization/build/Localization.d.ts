export * from './Localization.types';
/**
 * List of user's locales, returned as an array of objects of type `Locale`.
 * Guaranteed to contain at least 1 element.
 * These are returned in the order the user defines in their device settings.
 * On the web currency and measurements systems are not provided, instead returned as null.
 * If needed, you can infer them from the current region using a lookup table.
 * @example
 * ```js
 * [{
 *   "languageTag": "pl-PL",
 *   "languageCode": "pl",
 *   "textDirection": "ltr",
 *   "digitGroupingSeparator": " ",
 *   "decimalSeparator": ",",
 *   "measurementSystem": "metric",
 *   "currencyCode": "PLN",
 *   "currencySymbol": "zł",
 *   "regionCode": "PL",
 *   "temperatureUnit": "celsius"
 * }]
 * ```
 */
export declare const getLocales: () => [import("./Localization.types").Locale, ...import("./Localization.types").Locale[]];
/**
 * List of user's preferred calendars, returned as an array of objects of type `Calendar`.
 * Guaranteed to contain at least 1 element.
 * For now always returns a single element, but it's likely to return a user preference list on some platforms in the future.
 * @example
 * ```js
 * [{
 *   "calendar": "gregory",
 *   "timeZone": "Europe/Warsaw",
 *   "uses24hourClock": true,
 *   "firstWeekday": 1
 * }]
 * ```
 */
export declare const getCalendars: () => [import("./Localization.types").Calendar, ...import("./Localization.types").Calendar[]];
/**
 * A hook providing a list of user's locales, returned as an array of objects of type `Locale`.
 * Guaranteed to contain at least 1 element.
 * These are returned in the order the user defines in their device settings.
 * On the web currency and measurements systems are not provided, instead returned as null.
 * If needed, you can infer them from the current region using a lookup table.
 * If the OS settings change, the hook will rerender with a new list of locales.
 * @example
 * ```js
 * [{
 *   "languageTag": "pl-PL",
 *   "languageCode": "pl",
 *   "textDirection": "ltr",
 *   "digitGroupingSeparator": " ",
 *   "decimalSeparator": ",",
 *   "measurementSystem": "metric",
 *   "currencyCode": "PLN",
 *   "currencySymbol": "zł",
 *   "regionCode": "PL",
 *   "temperatureUnit": "celsius"
 * }]
 * ```
 */
export declare function useLocales(): [import("./Localization.types").Locale, ...import("./Localization.types").Locale[]];
/**
 * A hook providing a list of user's preferred calendars, returned as an array of objects of type `Calendar`.
 * Guaranteed to contain at least 1 element.
 * For now always returns a single element, but it's likely to return a user preference list on some platforms in the future.
 * If the OS settings change, the hook will rerender with a new list of calendars.
 * @example
 * ```js
 * [{
 *   "calendar": "gregory",
 *   "timeZone": "Europe/Warsaw",
 *   "uses24hourClock": true,
 *   "firstWeekday": 1
 * }]
 * ```
 */
export declare function useCalendars(): [import("./Localization.types").Calendar, ...import("./Localization.types").Calendar[]];
//# sourceMappingURL=Localization.d.ts.map