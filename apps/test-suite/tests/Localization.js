import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import { Platform } from 'react-native';

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

  function validateStringArray(result) {
    t.expect(result).toBeDefined();
    t.expect(Array.isArray(result)).toBe(true);
  }

  t.describe(`Localization methods`, () => {
    t.it('expect to getLocales return preferred locales', async () => {
      const locales = await Localization.getLocales();
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

    t.it('expect getCalendars to return at least a single calendar', async () => {
      const calendars = await Localization.getCalendars();
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

    t.it('expect async to return locale', async () => {
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
      if (Platform.OS !== 'web' || region) {
        validateString(region);
      }
      validateStringArray(isoCurrencyCodes);
      validateStringArray(locales);
      t.expect(locales[0]).toBe(Localization.locale);
      t.expect(typeof isRTL).toBe('boolean');
      t.expect(typeof isMetric).toBe('boolean');
      validateString(decimalSeparator);
      validateString(digitGroupingSeparator);
      if (Platform.OS !== 'web' || currency) {
        validateString(currency);
      }
    });
  });

  t.describe(`Localization defines constants`, () => {
    t.it('Gets the region', async () => {
      const result = Localization.region;
      if (Platform.OS !== 'web' || result) {
        validateString(result);
      }
    });
    t.it('Gets the locale', async () => {
      validateString(Localization.locale);
    });
    t.it('Gets the preferred locales', async () => {
      const result = Localization.locales;
      validateStringArray(result);
      t.expect(result.length > 0).toBe(true);
      t.expect(result[0]).toBe(Localization.locale);
    });
    t.it('Gets ISO currency codes', async () => {
      const result = Localization.isoCurrencyCodes;
      validateStringArray(result);
      result.map(validateString);
    });
    t.it('Gets the timezone', async () => {
      const result = Localization.timezone;
      if (result || Platform.OS !== 'web') {
        validateString(Localization.timezone);
      }
    });
    t.it('Gets the layout direction (ltr only)', async () => {
      const result = Localization.isRTL;
      t.expect(typeof result).toBe('boolean');
      t.expect(result).toBe(false);
    });
    t.it('Gets the measurement system (metric)', async () => {
      const result = Localization.isMetric;
      t.expect(typeof result).toBe('boolean');
    });
    t.it('Gets the decimal separator', async () => {
      validateString(Localization.decimalSeparator);
    });
    t.it('Gets the grouping separator', async () => {
      const result = Localization.decimalSeparator;
      t.expect(result).toBeDefined();
      t.expect(typeof result).toBe('string');
    });
    if (Platform.OS !== 'web') {
      t.it('Gets the currency', async () => {
        validateString(Localization.currency);
      });
    }
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
}
