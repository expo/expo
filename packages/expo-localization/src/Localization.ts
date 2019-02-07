import ExpoLocalization from './ExpoLocalization';

import { Localization } from './Localization.types';

export const locale = ExpoLocalization.locale;
export const locales = ExpoLocalization.locales;
export const timezone = ExpoLocalization.timezone;
export const isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
export const country = ExpoLocalization.country;
export const isRTL = ExpoLocalization.isRTL;

export async function getLocalizationAsync(): Promise<Localization> {
  return await ExpoLocalization.getLocalizationAsync();
}
