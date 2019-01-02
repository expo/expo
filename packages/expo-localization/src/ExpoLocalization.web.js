// @flow
import * as rtlDetect from 'rtl-detect';
import moment from 'moment';
import 'moment-timezone';

/*
 * TODO: Bacon: We only use moment for guessing the current timezone.
 * We should find a more cost-effective approach.
 */

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
      navigator.userLanguage ||
      this.locales[0];

    // The native format is en-US
    return locale.replace('_', '-');
  },
  get locales(): Array<string> {
    const { navigator = {} } = global;
    return navigator.languages || [];
  },
  get timezone(): string {
    return moment.tz.guess();
  },
  get isoCurrencyCodes(): Array<string> {
    // TODO: Bacon: Add this - very low priority
    return [];
  },
  get country(): string | null {
    const { locale } = this;
    if (typeof locale === 'string' && locale.length) {
      const isoCountryCode = locale.substring(locale.lastIndexOf('-') + 1);
      return isoCountryCode.toUpperCase();
    }
    return null;
  },
  async getLocalizationAsync(): Promise<{ [string]: any }> {
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
