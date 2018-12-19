import { Localization } from 'expo';
import { Localization as DangerZoneLocalization } from 'expo/DangerZone';
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

export function test(t) {
  t.describe(`Localization.getLocalizationAsync()`, () => {
    function validateString(result) {
      t.expect(result).toBeDefined();
      t.expect(typeof result).toBe('string');
      t.expect(result.length > 0).toBe(true);
    }

    function validateStringArray(result) {
      t.expect(result).toBeDefined();
      t.expect(Array.isArray(result)).toBe(true);
      // t.expect(result.length > 0).toBe(true);
    }

    t.it(`Localization.locale`, async () => {
      const { locale } = await Localization.getLocalizationAsync();
      validateString(locale);
    });

    t.it(`Localization.locales`, async () => {
      const { locales } = await Localization.getLocalizationAsync();
      validateStringArray(locales);
      t.expect(locales[0]).toBe(Localization.locale);
    });

    t.it(`Localization.timezone`, async () => {
      const { timezone } = await Localization.getLocalizationAsync();
      validateString(timezone);
    });

    t.it(`Localization.isoCurrencyCodes`, async () => {
      const { isoCurrencyCodes } = await Localization.getLocalizationAsync();
      validateStringArray(isoCurrencyCodes);
    });

    t.it(`Localization.country`, async () => {
      const { country } = await Localization.getLocalizationAsync();
      validateString(country);
    });

    t.it(`Localization.isRTL`, async () => {
      const { isRTL } = await Localization.getLocalizationAsync();
      t.expect(typeof isRTL).toBe('boolean');
    });
  });

  t.describe(`Localization defines constants`, () => {
    t.it('Gets the current device country', async () => {
      const result = Localization.country;

      t.expect(result).toBeDefined();
      t.expect(typeof result).toBe('string');
      t.expect(result.length > 0).toBe(true);
    });
    t.it('Gets the current locale', async () => {
      const result = Localization.locale;

      t.expect(result).toBeDefined();
      t.expect(typeof result).toBe('string');
      t.expect(result.length > 0).toBe(true);
    });
    t.it('Gets the preferred locales', async () => {
      const result = Localization.locales;

      t.expect(result).toBeDefined();
      t.expect(Array.isArray(result)).toBe(true);
      t.expect(result.length > 0).toBe(true);
      t.expect(result[0]).toBe(Localization.locale);
    });
    t.it('Gets ISO currency codes', async () => {
      const result = Localization.isoCurrencyCodes;
      t.expect(result).toBeDefined();
      t.expect(Array.isArray(result)).toBe(true);
      for (let iso of result) {
        t.expect(typeof iso).toBe('string');
        t.expect(iso.length > 0).toBe(true);
      }
    });
    t.it('Gets the current timzezone', async () => {
      const result = Localization.timezone;
      t.expect(result).toBeDefined();
      t.expect(typeof result).toBe('string');
      t.expect(result.length > 0).toBe(true);
      // Format: expect something like America/Los_Angeles or America/Chihuahua
      t.expect(result.split('/').length > 1).toBe(true);
    });
    t.it('Gets the current layout direction (ltr only)', async () => {
      const result = Localization.isRTL;
      t.expect(result).toBeDefined();
      t.expect(result).toBe(false);
    });
  });

  t.describe(`Localization works with i18n-js`, () => {
    i18n.locale = Localization.locale;
    i18n.translations = { en, fr, pl };
    i18n.missingTranslationPrefix = 'EE: ';
    i18n.fallbacks = true;

    t.it('expect language to match strings (en, pl, fr supported)', async () => {
      const target = 'good';

      i18n.locale = Localization.locale;

      const expoPredictedLangTag = Localization.locale.split('-')[0];
      const translation = i18n.translations[expoPredictedLangTag];

      t.expect(translation[target]).toBe(i18n.t(target));
    });
  });

  t.describe(`DangerZone.Localization`, () => {
    const currentWarn = console.warn;

    t.beforeEach(() => {
      console.warn = currentWarn;
    });

    [
      ['getCurrentDeviceCountryAsync', 'country'],
      ['getCurrentLocaleAsync', 'locale'],
      ['getCurrentTimeZoneAsync', 'timezone'],
      ['getPreferredLocalesAsync', 'locales'],
      ['getISOCurrencyCodesAsync', 'isoCurrencyCodes'],
    ].forEach(obj => {
      const [deprecated, replacement] = obj;

      t.it(`${deprecated} is deprecated`, async () => {
        const target = `Expo.DangerZone.Localization.${deprecated}() is deprecated. Use \`Expo.Localization.${replacement}\` instead.`;

        let warning = null;
        console.warn = (...props) => {
          warning = props[0];
          console.warn = currentWarn;
        };

        const value = await DangerZoneLocalization[deprecated]();

        t.expect(warning).toBe(target);
        console.log('VVV', value, Localization[replacement]);
        t.expect(`${value}`).toBe(`${Localization[replacement]}`);
      });
    });
  });
}
