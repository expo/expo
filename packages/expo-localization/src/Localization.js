// @flow
import { NativeModulesProxy } from 'expo-core';

const { ExpoLocalization } = NativeModulesProxy;

type Localization = {
  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  country: ?string,
  isRTL: boolean,
};

class LocalizationModule {
  locale: string;
  locales: Array<string>;
  timezone: string;
  isoCurrencyCodes: ?Array<string>;
  country: ?string;
  isRTL: boolean;

  constructor() {
    this._syncLocals(ExpoLocalization);
  }

  _syncLocals = ({ locale, locales, timezone, isoCurrencyCodes, country, isRTL }: Localization) => {
    this.locale = locale;
    this.locales = locales;
    this.timezone = timezone;
    this.isoCurrencyCodes = isoCurrencyCodes;
    this.country = country;
    this.isRTL = isRTL;
  };

  getLocalizationAsync = async (): Promise<Localization> => {
    const localization = await ExpoLocalization.getLocalizationAsync();
    this._syncLocals(localization);
    return localization;
  };
}

export default new LocalizationModule();
