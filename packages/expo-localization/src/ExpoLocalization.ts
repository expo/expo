/* eslint-env browser */
import { Platform, type EventSubscription } from 'expo-modules-core';

import { Calendar, Locale, CalendarIdentifier } from './Localization.types';

const getNavigatorLocales = () => {
  if (Platform.isDOMAvailable) {
    return navigator.languages || [navigator.language];
  }
  const dtFormatLocale = Intl?.DateTimeFormat()?.resolvedOptions()?.locale;
  if (dtFormatLocale) {
    return [dtFormatLocale];
  }
  return [];
};

type ExtendedLocale = Intl.Locale &
  // typescript definitions for navigator language don't include some modern Intl properties
  Partial<{
    getTextInfo: () => { direction: 'ltr' | 'rtl' };
    timeZones: string[];
    weekInfo: { firstDay: number };
    hourCycles: string[];
    timeZone: string;
    calendars: string[];
  }>;

const WEB_LANGUAGE_CHANGE_EVENT = 'languagechange';
// https://wisevoter.com/country-rankings/countries-that-use-fahrenheit/
const USES_FAHRENHEIT = [
  'AG',
  'BZ',
  'VG',
  'FM',
  'MH',
  'MS',
  'KN',
  'BS',
  'CY',
  'TC',
  'US',
  'LR',
  'PW',
  'KY',
];

// https://localizejs.com/articles/localizing-for-right-to-left-languages-the-issues-to-consider
const USES_RTL = ['ar', 'arc', 'ckb', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ps', 'sd', 'ur', 'yi'];

export function addLocaleListener(
  // NOTE(@kitten): We never use the event's data
  listener: (event?: unknown) => void
): EventSubscription {
  addEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener);
  return {
    remove: () => removeEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener),
  };
}

export function addCalendarListener(
  // NOTE(@kitten): We never use the event's data
  listener: (event?: unknown) => void
): EventSubscription {
  addEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener);
  return {
    remove: () => removeEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener),
  };
}

export function removeSubscription(subscription: EventSubscription) {
  subscription.remove();
}

export default {
  getLocales(): Locale[] {
    const locales = getNavigatorLocales();
    return locales?.map((languageTag) => {
      let locale = {} as ExtendedLocale;

      // Properties added only for compatibility with native, use `toLocaleString` instead.
      let digitGroupingSeparator: string | null = null;
      let decimalSeparator: string | null = null;
      let temperatureUnit: 'fahrenheit' | 'celsius' | null = null;
      let textDirection: 'ltr' | 'rtl' | null = null;
      // Gracefully handle language codes like `en-GB-oed` which is unsupported
      // but is otherwise a valid language tag (grandfathered)
      try {
        digitGroupingSeparator =
          Array.from((10000).toLocaleString(languageTag)).filter((c) => c > '9' || c < '0')[0] ||
          null; // using 1e5 instead of 1e4 since for some locales (like pl-PL) 1e4 does not use digit grouping

        decimalSeparator = (1.1).toLocaleString(languageTag).substring(1, 2);

        if (typeof Intl !== 'undefined') {
          locale = new Intl.Locale(languageTag) as unknown as ExtendedLocale;
        }
      } catch {}

      const { region, language, script } = locale;

      textDirection = languageTextDirection(locale);
      if (region) {
        temperatureUnit = regionToTemperatureUnit(region);
      }

      return {
        languageTag,
        languageCode: language || languageTag.split('-')[0] || 'en',
        languageScriptCode: script || null,
        textDirection,
        digitGroupingSeparator,
        decimalSeparator,
        measurementSystem: null,
        currencyCode: null,
        currencySymbol: null,
        languageCurrencyCode: null,
        languageCurrencySymbol: null,
        // On web, we don't have a way to get the region code, except from the language tag. `regionCode` and `languageRegionCode` are the same.
        regionCode: region || null,
        languageRegionCode: region || null,
        temperatureUnit,
      };
    });
  },
  getCalendars(): Calendar[] {
    const locale = ((typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions()
      : null) ?? null) as unknown as null | ExtendedLocale;
    return [
      {
        calendar: ((locale?.calendar || locale?.calendars?.[0]) as CalendarIdentifier) || null,
        timeZone: locale?.timeZone || locale?.timeZones?.[0] || null,
        uses24hourClock: (locale?.hourCycle || locale?.hourCycles?.[0])?.startsWith('h2') ?? null, //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/hourCycle
        firstWeekday: locale?.weekInfo?.firstDay || null,
      },
    ];
  },
};

function regionToTemperatureUnit(region: string) {
  return USES_FAHRENHEIT.includes(region) ? 'fahrenheit' : 'celsius';
}

function languageTextDirection(locale: ExtendedLocale) {
  // getTextInfo API is not available in all browsers.
  if (typeof locale.getTextInfo === 'function') {
    return locale.getTextInfo()?.direction;
  }
  return USES_RTL.includes(locale.language) ? 'rtl' : 'ltr';
}
