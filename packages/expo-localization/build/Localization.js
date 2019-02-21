import ExpoLocalization from './ExpoLocalization';
export const locale = ExpoLocalization.locale;
export const locales = ExpoLocalization.locales;
export const timezone = ExpoLocalization.timezone;
export const isoCurrencyCodes = ExpoLocalization.isoCurrencyCodes;
export const country = ExpoLocalization.country;
export const isRTL = ExpoLocalization.isRTL;
export async function getLocalizationAsync() {
    return await ExpoLocalization.getLocalizationAsync();
}
//# sourceMappingURL=Localization.js.map