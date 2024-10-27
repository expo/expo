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

beforeEach(() => {
  for (const property of Object.keys(fakeLocalization)) {
    mockProperty(
      ExpoLocalization,
      property as keyof typeof ExpoLocalization,
      fakeLocalization[property]
    );
    mockProperty(Localization, property as keyof typeof Localization, fakeLocalization[property]);
  }
  mockProperty(
    ExpoLocalization,
    'getLocalizationAsync',
    jest.fn(async () => fakeLocalization)
  );
});

afterEach(() => {
  unmockAllProperties();
});

function validateString(result) {
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
}

function validateStringArray(result) {
  expect(result).toBeDefined();
  expect(Array.isArray(result)).toBe(true);
}

describe(`Localization methods`, () => {
  it(`expect async to return locale`, async () => {
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
});

describe(`Localization defines constants`, () => {
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

describe(`Localization works with i18n-js`, () => {
  i18n.locale = Localization.locale;
  i18n.translations = { en, fr, pl };
  i18n.missingTranslationPrefix = 'EE: ';
  i18n.fallbacks = true;

  it(`expect language to match strings (en, pl, fr supported)`, async () => {
    const target = 'good';

    i18n.locale = Localization.locale;

    const expoPredictedLangTag = Localization.locale.split('-')[0];
    const translation = i18n.translations[expoPredictedLangTag];

    expect(translation[target]).toBe(i18n.t(target));
  });
});
