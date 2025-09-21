/* eslint-env browser */
import { Platform } from 'expo-modules-core';
const FALLBACK_LOCALE = 'en-US';
const getNavigatorLocales = () => {
    if (Platform.isDOMAvailable) {
        if (navigator.languages?.length > 0) {
            return navigator.languages;
        }
        else if (navigator.language) {
            return [navigator.language];
        }
    }
    const dtFormatLocale = Intl?.DateTimeFormat()?.resolvedOptions()?.locale;
    if (dtFormatLocale) {
        return [dtFormatLocale];
    }
    return [FALLBACK_LOCALE];
};
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
listener) {
    addEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener);
    return {
        remove: () => removeEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener),
    };
}
export function addCalendarListener(
// NOTE(@kitten): We never use the event's data
listener) {
    addEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener);
    return {
        remove: () => removeEventListener(WEB_LANGUAGE_CHANGE_EVENT, listener),
    };
}
export function removeSubscription(subscription) {
    subscription.remove();
}
export default {
    getLocales() {
        const locales = getNavigatorLocales();
        return locales.map((languageTag) => {
            // TextInfo is an experimental API that is not available in all browsers.
            // We might want to consider using a locale lookup table instead.
            let locale = {};
            // Properties added only for compatibility with native, use `toLocaleString` instead.
            let digitGroupingSeparator = null;
            let decimalSeparator = null;
            let temperatureUnit = null;
            let textDirection = null;
            // Gracefully handle language codes like `en-GB-oed` which is unsupported
            // but is otherwise a valid language tag (grandfathered)
            try {
                digitGroupingSeparator =
                    Array.from((10000).toLocaleString(languageTag)).filter((c) => c > '9' || c < '0')[0] ||
                        null; // using 1e5 instead of 1e4 since for some locales (like pl-PL) 1e4 does not use digit grouping
                decimalSeparator = (1.1).toLocaleString(languageTag).substring(1, 2);
                if (typeof Intl !== 'undefined') {
                    locale = new Intl.Locale(languageTag);
                }
            }
            catch { }
            const { region, language, script } = locale;
            textDirection =
                locale.getTextInfo?.()?.direction ??
                    locale.textInfo?.direction ??
                    languageTextDirection(language);
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
    getCalendars() {
        const locale = ((typeof Intl !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions()
            : null) ?? null);
        return [
            {
                calendar: (locale?.calendar || locale?.calendars?.[0]) || null,
                timeZone: locale?.timeZone || locale?.timeZones?.[0] || null,
                uses24hourClock: (locale?.hourCycle || locale?.hourCycles?.[0])?.startsWith('h2') ?? null, //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/hourCycle
                firstWeekday: locale?.weekInfo?.firstDay || null,
            },
        ];
    },
};
function regionToTemperatureUnit(region) {
    return USES_FAHRENHEIT.includes(region) ? 'fahrenheit' : 'celsius';
}
function languageTextDirection(language) {
    return USES_RTL.includes(language) ? 'rtl' : 'ltr';
}
//# sourceMappingURL=ExpoLocalization.js.map