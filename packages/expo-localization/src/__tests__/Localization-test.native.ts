import i18n from 'i18n-js';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExpoLocalization from '../ExpoLocalization';
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

/**
 * @deprecated
 */
const fakeLocalization: Partial<typeof ExpoLocalization> = {
  locale: 'en-US',
  locales: ['en-US', 'fr'],
  timezone: 'Etc/UTC',
  isoCurrencyCodes: [],
  region: 'US',
  isRTL: false,
  isMetric: false,
  currency: 'USD',
  decimalSeparator: '.',
  digitGroupingSeparator: ',',
};

const fakeLocaleNewApi: Localization.Locale[] = [
  {
    currencyCode: 'USD',
    decimalSeparator: '.',
    digitGroupingSeparator: ',',
    languageCode: 'en',
    languageRegionCode: 'US',
    languageScriptCode: 'Latn',
    languageTag: 'en-US',
    regionCode: 'US',
    currencySymbol: '$',
    measurementSystem: 'metric',
    textDirection: 'ltr',
    temperatureUnit: 'celsius',
    languageCurrencyCode: 'USD',
    languageCurrencySymbol: '$',
  },
];

const fakeCalendarNewApi: Localization.Calendar[] = [
  {
    calendar: Localization.CalendarIdentifier.GREGORIAN,
    uses24hourClock: false,
    firstWeekday: Localization.Weekday.SUNDAY,
    timeZone: 'America/Los_Angeles',
  },
];

beforeEach(() => {
  for (const property of Object.keys(fakeLocalization)) {
    mockProperty(
      ExpoLocalization,
      property as keyof typeof ExpoLocalization,
      fakeLocalization[property as keyof typeof ExpoLocalization]
    );
    mockProperty(
      Localization,
      property as keyof typeof Localization,
      fakeLocalization[property as keyof typeof fakeLocalization]
    );
  }
  mockProperty(
    ExpoLocalization,
    'getLocalizationAsync',
    jest.fn(async () => fakeLocalization)
  );
  mockProperty(
    Localization,
    'getLocales',
    jest.fn(() => fakeLocaleNewApi)
  );
  mockProperty(
    Localization,
    'getCalendars',
    jest.fn(() => fakeCalendarNewApi)
  );
});

afterEach(() => {
  unmockAllProperties();
});

function validateString(result: unknown): asserts result is string {
  expect(typeof result).toBe('string');
  expect((result as string).length).toBeGreaterThan(0);
}

function validateStringArray(result: unknown): asserts result is string[] {
  expect(result).toBeDefined();
  expect(Array.isArray(result)).toBe(true);
}

describe(`Localization methods`, () => {
  it(`expect deprecated getLocalizationAsync to return locale`, async () => {
    const {
      currency,
      decimalSeparator,
      digitGroupingSeparator,
      isoCurrencyCodes,
      isMetric,
      isRTL,
      locale,
      locales,
      timezone,
      region,
    } = await Localization.getLocalizationAsync();

    validateString(locale);
    validateString(timezone);
    validateString(region);
    validateStringArray(isoCurrencyCodes);
    validateStringArray(locales);
    expect(locales[0]).toBe(Localization.locale);
    expect(typeof isRTL).toBe('boolean');
    expect(typeof isMetric).toBe('boolean');
    validateString(decimalSeparator);
    validateString(digitGroupingSeparator);
    validateString(currency);
  });

  it('expect getLocales to return an array of locales with valid properties', () => {
    const locales = Localization.getLocales();
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(0);

    locales.forEach((locale) => {
      expect(locale).toHaveProperty('currencyCode');
      expect(locale).toHaveProperty('decimalSeparator');
      expect(locale).toHaveProperty('digitGroupingSeparator');
      expect(locale).toHaveProperty('languageCode');
      expect(locale).toHaveProperty('languageRegionCode');
      expect(locale).toHaveProperty('languageScriptCode');
      expect(locale).toHaveProperty('languageTag');
      expect(locale).toHaveProperty('regionCode');
      expect(locale).toHaveProperty('currencySymbol');
      expect(locale).toHaveProperty('measurementSystem');
      expect(locale).toHaveProperty('textDirection');
      expect(locale).toHaveProperty('temperatureUnit');
      expect(locale).toHaveProperty('languageCurrencyCode');
      expect(locale).toHaveProperty('languageCurrencySymbol');
    });
  });

  it('expect getCalendars to return an array of calendars with valid properties', () => {
    const calendars = Localization.getCalendars();
    expect(Array.isArray(calendars)).toBe(true);
    expect(calendars.length).toBeGreaterThan(0);

    calendars.forEach((calendar) => {
      expect(calendar).toHaveProperty('calendar');
      expect(calendar).toHaveProperty('timeZone');
      expect(calendar).toHaveProperty('uses24hourClock');
      expect(calendar).toHaveProperty('firstWeekday');
    });
  });
});

describe(`Localization defines deprecated constants`, () => {
  it('Gets the region', async () => {
    validateString(Localization.region);
  });
  it('Gets the locale', async () => {
    validateString(Localization.locale);
  });
  it('Gets the preferred locales', async () => {
    const result = Localization.locales;
    validateStringArray(result);
    expect(result.length > 0).toBe(true);
    expect(result[0]).toBe(Localization.locale);
  });
  it('Gets ISO currency codes', async () => {
    const result = Localization.isoCurrencyCodes;
    validateStringArray(result);
    result.forEach(validateString);
  });
  it('Gets the timezone', async () => {
    validateString(Localization.timezone);
  });
  it('Gets the layout direction (ltr only)', async () => {
    const result = Localization.isRTL;
    expect(typeof result).toBe('boolean');
    expect(result).toBe(false);
  });
  it('Gets the measurement system (metric)', async () => {
    const result = Localization.isMetric;
    expect(typeof result).toBe('boolean');
  });
  it('Gets the decimal separator', async () => {
    validateString(Localization.decimalSeparator);
  });
  it('Gets the digit grouping separator', async () => {
    const result = Localization.digitGroupingSeparator;
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  it('Gets the currency', async () => {
    validateString(Localization.currency);
  });
});

describe('New Localization API works with i18n-js', () => {
  it('expect language to match strings (en, pl, fr supported)', async () => {
    const [locale] = Localization.getLocales();
    i18n.locale = locale.languageTag;
    i18n.translations = { en, fr, pl };
    i18n.missingTranslationPrefix = 'EE: ';
    i18n.fallbacks = true;
    const target = 'good';

    i18n.locale = locale.languageTag;

    const expoPredictedLangTag = locale.languageTag.split('-')[0];
    const translation = i18n.translations[expoPredictedLangTag];

    expect((translation as any)[target]).toBe(i18n.t(target));
  });
});

describe(`Deprecated localization API works with i18n-js`, () => {
  i18n.locale = Localization.locale;
  i18n.translations = { en, fr, pl };
  i18n.missingTranslationPrefix = 'EE: ';
  i18n.fallbacks = true;

  it(`expect language to match strings (en, pl, fr supported)`, async () => {
    const target = 'good';

    i18n.locale = Localization.locale;

    const expoPredictedLangTag = Localization.locale.split('-')[0];
    const translation = i18n.translations[expoPredictedLangTag];

    expect((translation as any)[target]).toBe(i18n.t(target));
  });
});
