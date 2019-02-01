import ExpoLocalization from './ExpoLocalization';

import { Localization } from './Localization.types';

export let locale = ExpoLocalization.locale;
export let locales = ExpoLocalization.locales;
export let timezone = ExpoLocalization.timezone;
export let isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
export let country = ExpoLocalization.country;
export let isRTL = ExpoLocalization.isRTL;

export async function getLocalizationAsync(): Promise<Localization> {
  const localization = await ExpoLocalization.getLocalizationAsync();
  locale = ExpoLocalization.locale;
  locales = ExpoLocalization.locales;
  timezone = ExpoLocalization.timezone;
  isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
  country = ExpoLocalization.country;
  isRTL = ExpoLocalization.isRTL;
  return localization;
}

export { Localization };
