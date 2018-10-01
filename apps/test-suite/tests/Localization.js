import { Localization } from 'expo';
import i18n from 'i18n-js';

const en = {
  foo: 'Nave',
  bar: 'Nocab',
};

const fr = {
  foo: 'Nocab',
  bar: 'Nave',
};

export const name = 'Localization';

export function test(t) {
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
      t.expect(result.length > 0).toBe(true);
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

  t.describe(`Localization has listeners`, () => {
    t.it('Can use callbacks', async () => {
      function isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
      }

      t.expect(isFunction(Localization.addListener)).toBe(true);
      t.expect(isFunction(Localization.removeSubscription)).toBe(true);
      t.expect(isFunction(Localization.removeAllListeners)).toBe(true);
      const subscription = Localization.addListener(() => {});

      t.expect(subscription).toBeDefined();
      t.expect(isFunction(subscription.remove)).toBe(true);
      subscription.remove();
    });
  });

  t.describe(`Localization works with i18n-js`, () => {
    i18n.locale = Localization.locale;
    i18n.translations = { en, fr };
    i18n.missingTranslationPrefix = 'EE: ';
    i18n.fallbacks = true;

    t.it('expect language to match strings (en only)', async () => {
      const target = 'foo';

      i18n.locale = Localization.locale;

      const expoPredictedLangTag = Localization.locale.split('-')[0];
      const translation = i18n.translations[expoPredictedLangTag];

      t.expect(translation[target]).toBe(i18n.t(target));
    });
  });
}
