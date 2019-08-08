import * as rtlDetect from 'rtl-detect';

import { Localization } from './Localization.types';

export default {
  get isRTL(): boolean {
    return rtlDetect.isRtlLang(this.locale);
  },
  get locale(): string {
    const locale =
      navigator.language ||
      navigator['systemLanguage'] ||
      navigator['browserLanguage'] ||
      navigator['userLanguage'] ||
      this.locales[0];
    return locale;
  },
  get locales(): string[] {
    const { languages = [] } = navigator;
    return Array.from(languages);
  },
  get timezone(): string {
    const defaultTimeZone = 'Etc/UTC';
    if (typeof Intl === 'undefined') {
      return defaultTimeZone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimeZone;
  },
  get isoCurrencyCodes(): string[] {
    // TODO: Bacon: Add this - very low priority
    return [];
  },
  get country(): string | undefined {
    const { locale } = this;
    if (typeof locale === 'string' && locale.length) {
      const isoCountryCode = locale.substring(locale.lastIndexOf('-') + 1);
      return isoCountryCode.toUpperCase();
    }
    return undefined;
  },
  async getLocalizationAsync(): Promise<Localization> {
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
