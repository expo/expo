/* eslint-env browser */
import { Platform } from '@unimodules/core';
import * as rtlDetect from 'rtl-detect';

import { Localization } from './Localization.types';

export default {
  get isRTL(): boolean {
    return rtlDetect.isRtlLang(this.locale) ?? false;
  },
  get locale(): string {
    if (!Platform.isDOMAvailable) {
      return '';
    }

    const locale =
      navigator.language ||
      navigator['systemLanguage'] ||
      navigator['browserLanguage'] ||
      navigator['userLanguage'] ||
      this.locales[0];
    return locale;
  },
  get locales(): string[] {
    if (!Platform.isDOMAvailable) {
      return [];
    }
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
    // TODO(Bacon): Add this - very low priority
    return [];
  },
  get region(): string | null {
    const { locale } = this;
    if (typeof locale === 'string') {
      const [, iso] = locale.split('-');
      return iso ? iso.toUpperCase() : null;
    }
    return null;
  },
  async getLocalizationAsync(): Promise<Localization> {
    const { region, isoCurrencyCodes, timezone, locales, locale, isRTL } = this;
    return {
      region,
      isoCurrencyCodes,
      timezone,
      locales,
      locale,
      isRTL,
    };
  },
};
