// @flow
import ExpoLocalization from './ExpoLocalization';

type Localization = {
  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  country: ?string,
  isRTL: boolean,
};

export default {
  locale: ExpoLocalization.locale,
  locales: ExpoLocalization.locales,
  timezone: ExpoLocalization.timezone,
  isoCurrencyCodes: ExpoLocalization.isoCurrencyCodes,
  country: ExpoLocalization.country,
  isRTL: ExpoLocalization.isRTL,
  async getLocalizationAsync(): Promise<Localization> {
    const localization = await ExpoLocalization.getLocalizationAsync();
    this.locale = ExpoLocalization.locale;
    this.locales = ExpoLocalization.locales;
    this.timezone = ExpoLocalization.timezone;
    this.isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
    this.country = ExpoLocalization.country;
    this.isRTL = ExpoLocalization.isRTL;
    return localization;
  },
};
