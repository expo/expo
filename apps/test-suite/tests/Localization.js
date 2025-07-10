import * as Localization from 'expo-localization';
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
  function validateString(result) {
    t.expect(result).toBeDefined();
    t.expect(typeof result).toBe('string');
    t.expect(result.length > 0).toBe(true);
  }

  t.describe(`Localization methods`, () => {
    t.it('expect to getLocales return preferred locales', () => {
      const locales = Localization.getLocales();
      t.expect(locales.length).toBeGreaterThanOrEqual(1);
      const {
        languageTag,
        languageCode,
        regionCode,
        currencyCode,
        currencySymbol,
        decimalSeparator,
        digitGroupingSeparator,
        textDirection,
        measurementSystem,
      } = locales[0];
      validateString(languageTag);
      validateString(languageCode);
      // following properties can be nullish if the locale does not provide/override them
      t.expect(regionCode).toBeDefined();
      t.expect(currencyCode).toBeDefined();
      t.expect(currencySymbol).toBeDefined();
      t.expect(decimalSeparator).toBeDefined();
      t.expect(digitGroupingSeparator).toBeDefined();
      t.expect(textDirection).toBeDefined();
      if (textDirection) {
        t.expect(['rtl', 'ltr'].includes(textDirection)).toBe(true);
      }
      t.expect(measurementSystem).toBeDefined();
      if (measurementSystem) {
        t.expect(['metric', 'us', 'uk'].includes(measurementSystem)).toBe(true);
      }
    });

    t.it('expect getCalendars to return at least a single calendar', () => {
      const calendars = Localization.getCalendars();
      t.expect(calendars.length).toBeGreaterThanOrEqual(1);
      const { calendar, uses24hourClock, firstWeekday, timeZone } = calendars[0];
      t.expect(calendar).toBeDefined();
      t.expect(timeZone).toBeDefined();
      // following properties can be nullish if the locale does not provide/override them
      t.expect(uses24hourClock).toBeDefined();
      if (uses24hourClock !== null) {
        t.expect(typeof uses24hourClock).toBe('boolean');
      }
      t.expect(firstWeekday).toBeDefined();
      if (firstWeekday !== null) {
        t.expect(typeof firstWeekday).toBe('number');
      }
    });
  });

  t.describe(`Localization works with i18n-js`, () => {
    i18n.locale = Localization.getLocales()[0].languageCode;
    i18n.translations = { en, fr, pl };
    i18n.missingTranslationPrefix = 'EE: ';
    i18n.fallbacks = true;

    t.it('expect language to match strings (en, pl, fr supported)', async () => {
      const target = 'good';

      i18n.locale = Localization.getLocales()[0].languageCode;

      const expoPredictedLangTag = Localization.getLocales()[0].languageCode;
      const translation = i18n.translations[expoPredictedLangTag];

      t.expect(translation[target]).toBe(i18n.t(target));
    });
  });
}
