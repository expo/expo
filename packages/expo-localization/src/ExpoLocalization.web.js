// @flow
import * as rtlDetect from 'rtl-detect';

export default {
  get isRTL(): boolean {
    return rtlDetect.isRtlLang(this.locale);
  },
  get locale(): string {
    const { navigator = {} } = global;
    let locale =
      navigator.language ||
      navigator.systemLanguage ||
      navigator.browserLanguage ||
      navigator.userLanguage;
    if (!locale && navigator.languages && navigator.languages.length) {
      locale = navigator.languages[0];
    }
    return locale;
  },
  get locales(): Array<string> {
    const { navigator = {} } = global;
    return navigator.languages;
  },
  get timezone(): string {
    const moment = require('moment');
    require('moment-timezone');
    return moment.tz.guess();
  },
  get isoCurrencyCodes(): Array<string> {
    /*
     * TODO: Bacon: Add this - very low priority
     */
    return [];
  },
  get country(): string {
    return this.locale;
  },
  async getLocalizationAsync(): Promise<Object> {
    /*
     * TODO: Bacon: This seems dangerous. 
     * On Android this method only returns new values when you go to settings and change the language.
     * So maybe it doesn't matter that we can actually refresh.
     */
    // window.location.reload(true);

    const { country, isoCurrencyCodes, timezone, locales, locale, isRTL } = this;
    return {
      country,
      isoCurrencyCodes,
      timezone,
      locales,
      locale,
      isRTL,
    };
  },
};
