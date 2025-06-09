import i18n from 'i18n-js';

import * as Localization from '../Localization';

const en = {
  good: 'good',
  morning: 'morning',
};

const fr = {
  good: 'bien',
  morning: 'matin',
};

const pl = {
  good: 'dobry',
  morning: 'rano',
};

function validateString(result: unknown): asserts result is string {
  expect(typeof result).toBe('string');
  expect((result as string).length).toBeGreaterThan(0);
}

function validateNumber(result: unknown): asserts result is number {
  expect(typeof result).toBe('number');
}

function validateBoolean(result: unknown): asserts result is boolean {
  expect(typeof result).toBe('boolean');
}

describe(`Localization methods`, () => {
  it(`expect getLocales to return locale`, async () => {
    const {
      languageTag,
      languageCode,
      languageScriptCode,
      textDirection,
      digitGroupingSeparator,
      decimalSeparator,
      currencyCode,
      languageCurrencyCode,
      languageCurrencySymbol,
      currencySymbol,
      regionCode,
      temperatureUnit,
    } = Localization.getLocales()[0];

    validateString(languageTag);
    validateString(languageCode);
    validateString(languageScriptCode);
    validateString(textDirection);
    validateString(currencyCode);
    validateString(currencySymbol);
    validateString(regionCode);
    validateString(decimalSeparator);
    validateString(digitGroupingSeparator);
    validateString(languageCurrencyCode);
    validateString(languageCurrencySymbol);
    validateString(temperatureUnit);
  });

  it(`expect getCalendars to return calendar`, async () => {
    const { calendar, timeZone, uses24hourClock, firstWeekday } = Localization.getCalendars()[0];

    validateString(calendar);
    validateString(timeZone);
    validateNumber(firstWeekday);
    validateBoolean(uses24hourClock);
  });
});

describe(`Localization works with i18n-js`, () => {
  i18n.locale = Localization.getLocales()[0].languageCode ?? 'en';
  i18n.translations = { en, fr, pl };
  i18n.missingTranslationPrefix = 'EE: ';
  i18n.fallbacks = true;

  it(`expect language to match strings (en, pl, fr supported)`, async () => {
    const target = 'good';

    i18n.locale = Localization.getLocales()[0].languageCode ?? 'en';

    const expoPredictedLangTag = Localization.getLocales()[0].languageCode ?? 'en';
    const translation = i18n.translations[expoPredictedLangTag];

    expect((translation as any)[target]).toBe(i18n.t(target));
  });
});
