import { NativeModulesProxy, Platform } from 'expo-core';
const { ExpoLocalization } = NativeModulesProxy;

const isObject = obj => obj && obj.constructor && obj.constructor === Object;

class LocaleStore {
  constructor(locales) {
    if (isObject(locales) === false || Object.keys(locales).length <= 1) {
      throw new Error('Locales input must be an object and non-empty');
    }
    const copy = { ...locales };
    const allGivenLocales = new Set(Object.keys(copy));
    let currentLocaleName = [...allGivenLocales][0];
    const defaultLocale = copy[currentLocaleName];
    const defaultLocaleName = currentLocaleName;
    const defaultLocalePhrases = new Set(Object.keys(defaultLocale));
    let currentLocale = defaultLocale;

    const setLocaleHelper = (newLocaleName, cb) => {
      if (allGivenLocales.has(newLocaleName) === false) {
        if (__DEV__) {
          const s = `${newLocaleName} is not a valid locale, known locales are ${[
            ...allGivenLocales,
          ]}`;
          console.error(s);
        }
      }
      if (newLocaleName === currentLocaleName) {
        if (__DEV__) {
          console.warn('New Locale is the same as last, locale not changed');
        }
        return;
      }
      currentLocale = copy[newLocaleName];
      currentLocaleName = newLocaleName;
      cb && cb();
    };
    const localizationValueHelper = name => {
      if (defaultLocalePhrases.has(name)) {
        const result = currentLocale[name];
        if (result !== undefined) {
          return result !== undefined ? result : defaultLocale[name];
        } else {
          const fallback = defaultLocale[name];
          if (fallback === undefined) {
            if (__DEV__) {
              let s = `Fallback locale ${defaultLocaleName} is missing a string value for ${name}`;
              console.error(s);
            }
            return '';
          }
          return fallback;
        }
      }
    };

    if (Platform.OS === 'android') {
      let localizedValues = new Set<string>();
      for (const values of Object.values(copy)) {
        Object.keys(values).forEach(s => localizedValues.add(s));
      }
      const proxy = {};
      Object.defineProperty(proxy, 'setLocale', {
        get() {
          return setLocaleHelper;
        },
      });

      const methods = new Set(['setLocale']);
      for (const name of localizedValues.keys()) {
        if (methods.has(name)) {
          throw new Error(`Cannot use ${name} as a locale name`);
        }
        Object.defineProperty(proxy, name, {
          get() {
            return localizationValueHelper(name);
          },
        });
      }
      return proxy;
    } else if (Platform.OS === 'ios') {
      const handlers = { setLocale: setLocaleHelper };
      const methods = new Set(Object.keys(handlers));
      return new Proxy(this, {
        set() {
          if (__DEV__) {
            console.warn('Setting anything directly on the localization store is a no op');
          }
          return false;
        },
        get(target, name) {
          if (typeof name !== 'string') {
            return target[name];
          } else {
            if (defaultLocalePhrases.has(name)) {
              return localizationValueHelper(name);
            } else if (methods.has(name)) {
              return handlers[name];
            } else {
              return target[name];
            }
          }
        },
      });
    } else {
      throw new Error(`Unsupported platform at moment for localization: ${Platform.OS}`);
    }
  }
}

function warnDeprecated(deprecated, replacement) {
  console.warn(
    `Expo.DangerZone.Localization.${deprecated} is deprecated. Use \`Expo.Localization.${replacement}\` instead.`
  );
}

export default {
  ...ExpoLocalization,
  getCurrentDeviceCountryAsync() {
    warnDeprecated('getCurrentDeviceCountryAsync()', 'country');
    return ExpoLocalization.country;
  },
  getCurrentLocaleAsync() {
    warnDeprecated('getCurrentLocaleAsync()', 'locale');
    return ExpoLocalization.locale.replace('-', '_');
  },
  getCurrentTimeZoneAsync() {
    warnDeprecated('getCurrentTimeZoneAsync()', 'timezone');
    return ExpoLocalization.timezone;
  },
  getPreferredLocalesAsync() {
    warnDeprecated('getPreferredLocalesAsync()', 'locales');
    return ExpoLocalization.locales;
  },
  getISOCurrencyCodesAsync() {
    warnDeprecated('getISOCurrencyCodesAsync()', 'isoCurrencyCodes');
    return ExpoLocalization.isoCurrencyCodes;
  },
  LocaleStore,
};
