import { Platform } from '@unimodules/core';

import * as Localization from '../Localization';

if (Platform.isDOMAvailable) {
  describe(`Localization methods`, () => {
    it(`expect async to return locale`, async () => {
      function validateString(result) {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        if (result) expect(result.length > 0).toBe(true);
      }

      function validateStringArray(result) {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }

      const {
        locale,
        locales,
        timezone,
        isoCurrencyCodes,
        region,
        isRTL,
      } = await Localization.getLocalizationAsync();

      validateString(locale);
      validateString(timezone);
      validateString(region);

      validateStringArray(isoCurrencyCodes);
      validateStringArray(locales);
      expect(locales[0]).toBe(Localization.locale);
      expect(typeof isRTL).toBe('boolean');
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
  it(`Gets the current device region`, async () => {
    const result = Localization.region;

    if (Platform.isDOMAvailable) {
      expect(typeof result).toBe('string');
      if (result) expect(result.length > 0).toBe(true);
    } else {
      expect(result).toBe(null);
    }
  });

  it(`Gets the current locale`, async () => {
    const result = Localization.locale;

    if (Platform.isDOMAvailable) {
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    } else {
      // Empty in node env
      expect(result).toBe('');
    }
  });

  it(`Gets the preferred locales`, async () => {
    const result = Localization.locales;

    expect(Array.isArray(result)).toBe(true);
    if (Platform.isDOMAvailable) {
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBe(Localization.locale);
    } else {
      expect(result.length).toBe(0);
    }
  });

  it(`Gets ISO currency codes`, async () => {
    const result = Localization.isoCurrencyCodes;
    expect(Array.isArray(result)).toBe(true);
    for (const iso of result) {
      expect(typeof iso).toBe('string');
      expect(iso.length > 0).toBe(true);
    }
  });

  it(`Gets the current layout direction (LTR only)`, async () => {
    const result = Localization.isRTL;
    expect(result).toBe(false);
  });
});
