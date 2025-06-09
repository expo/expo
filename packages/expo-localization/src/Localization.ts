import { useEffect, useReducer, useMemo } from 'react';

import ExpoLocalization, {
  addCalendarListener,
  addLocaleListener,
  removeSubscription,
} from './ExpoLocalization';

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
export const getLocales = ExpoLocalization.getLocales;

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
export const getCalendars = ExpoLocalization.getCalendars;

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
export function useLocales() {
  const [key, invalidate] = useReducer((k) => k + 1, 0);
  const locales = useMemo(() => getLocales(), [key]);
  useEffect(() => {
    const subscription = addLocaleListener(invalidate);
    return () => {
      removeSubscription(subscription);
    };
  }, []);
  return locales;
}

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
export function useCalendars() {
  const [key, invalidate] = useReducer((k) => k + 1, 0);
  const calendars = useMemo(() => getCalendars(), [key]);
  useEffect(() => {
    const subscription = addCalendarListener(invalidate);
    return () => {
      removeSubscription(subscription);
    };
  }, []);
  return calendars;
}
