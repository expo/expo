import ExpoLocalization from './ExpoLocalization';

import { Localization } from './Localization.types';

// Web, Android, and some iOS values use `-`. This will convert the iOS values that use `_`
// https://github.com/expo/expo/blob/21ae94bae2e8369992050c433a00699d425b35bd/packages/expo/src/Localization.ts#L112-L114
const parseLocale = (locale: string): string => locale.replace('_', '-');

export const locale = parseLocale(ExpoLocalization.locale);
export const locales = ExpoLocalization.locales.map(parseLocale);
export const timezone = ExpoLocalization.timezone;
export const isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
export const country = ExpoLocalization.country;
export const isRTL = ExpoLocalization.isRTL;

export async function getLocalizationAsync(): Promise<Localization> {
  const { locale, locales, ...localization } = await ExpoLocalization.getLocalizationAsync();
  return {
    locale: parseLocale(locale),
    locales: ExpoLocalization.locales.map(parseLocale),
    ...localization,
  };
}
