import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import i18n from 'i18n-js';

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

export const name = 'Localization';

export function test({ describe, afterEach, it, expect, jasmine, ...t }) {
  describe(`Localization methods`, () => {
    it('expect async to return locale', async () => {
      function validateString(result) {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length > 0).toBe(true);
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
      if (Platform.OS === 'ios') {
        validateString(region);
      }
      validateStringArray(isoCurrencyCodes);
      validateStringArray(locales);
      expect(locales[0]).toBe(Localization.locale);
      expect(typeof isRTL).toBe('boolean');
    });
  });

  describe(`Localization defines constants`, () => {
    if (Platform.OS === 'ios') {
      it('Gets the current device country', async () => {
        const result = Localization.region;

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length > 0).toBe(true);
      });
    }
    it('Gets the current locale', async () => {
      const result = Localization.locale;

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    });
    it('Gets the preferred locales', async () => {
      const result = Localization.locales;

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length > 0).toBe(true);
      expect(result[0]).toBe(Localization.locale);
    });
    it('Gets ISO currency codes', async () => {
      const result = Localization.isoCurrencyCodes;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      for (let iso of result) {
        expect(typeof iso).toBe('string');
        expect(iso.length > 0).toBe(true);
      }
    });
    if (Platform.OS !== 'web') {
      it('Gets the current timezone', async () => {
        const result = Localization.timezone;
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length > 0).toBe(true);
        // Format: expect something like America/Los_Angeles or America/Chihuahua
        expect(result.split('/').length > 1).toBe(true);
      });
    }

    it('Gets the current layout direction (ltr only)', async () => {
      const result = Localization.isRTL;
      expect(result).toBeDefined();
      expect(result).toBe(false);
    });
  });

  describe(`Localization works with i18n-js`, () => {
    i18n.locale = Localization.locale;
    i18n.translations = { en, fr, pl };
    i18n.missingTranslationPrefix = 'EE: ';
    i18n.fallbacks = true;

    it('expect language to match strings (en, pl, fr supported)', async () => {
      const target = 'good';

      i18n.locale = Localization.locale;

      const expoPredictedLangTag = Localization.locale.split('-')[0];
      const translation = i18n.translations[expoPredictedLangTag];

      expect(translation[target]).toBe(i18n.t(target));
    });
  });
}
