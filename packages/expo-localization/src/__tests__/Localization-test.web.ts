import { Platform } from 'expo-modules-core';

import * as Localization from '../Localization';

function validateString(result, allowEmpty = false) {
  expect(typeof result).toBe('string');
  if (!allowEmpty) {
    expect(result.length).toBeGreaterThan(0);
  }
}

function validateStringArray(result) {
  expect(result).toBeDefined();
  expect(Array.isArray(result)).toBe(true);
}

if (Platform.isDOMAvailable) {
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
      validateString(digitGroupingSeparator, true);
      expect(currency).toBe(null);
    });
  });
}

if (Platform.isDOMAvailable) {
  describe('region', () => {
    it(`can resolve a region with a partial locale`, async () => {
      jest.spyOn(navigator, 'language', 'get').mockReturnValue('en');

      const Localization = require('../ExpoLocalization').default;
      expect(Localization.locale).toBe('en');
      expect(Localization.region).toBe(null);
    });
    xit(`can resolve a region from a full locale`, async () => {
      jest.spyOn(navigator, 'language', 'get').mockReturnValue('en-us');

      const Localization = require('../ExpoLocalization').default;
      expect(Localization.locale).toBe('en-us');
      expect(Localization.region).toBe('US');
    });
  });
}

describe(`Localization defines constants`, () => {
  it('Gets the region', async () => {
    const result = Localization.region;
    if (Platform.isDOMAvailable) {
      validateString(result);
    } else {
      expect(result).toBe(null);
    }
  });
  it('Gets the locale', async () => {
    const result = Localization.locale;
    if (Platform.isDOMAvailable) {
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    } else {
      // Empty in node env
      expect(result).toBe('');
    }
  });
  it('Gets the preferred locales', async () => {
    const result = Localization.locales;
    validateStringArray(result);
    if (Platform.isDOMAvailable) {
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBe(Localization.locale);
    } else {
      expect(result.length).toBe(0);
    }
  });
  it('Gets ISO currency codes', async () => {
    const result = Localization.isoCurrencyCodes;
    validateStringArray(result);
    result.forEach((res) => validateString(res));
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
  it.skip('Gets the currency', async () => {
    validateString(Localization.currency);
  });
});
