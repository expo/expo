/* eslint-env browser */
import { Platform } from 'expo-modules-core';
import * as rtlDetect from 'rtl-detect';

import { Localization } from './Localization.types';

export default {
  get currency(): string | null {
    // TODO: Add support
    return null;
  },
  get decimalSeparator(): string {
    return (1.1).toLocaleString().substring(1, 2);
  },
  get digitGroupingSeparator(): string {
    const value = (1000).toLocaleString();
    return value.length === 5 ? value.substring(1, 2) : '';
  },
  get isRTL(): boolean {
    return rtlDetect.isRtlLang(this.locale) ?? false;
  },
  get isMetric(): boolean {
    const { region } = this;
    switch (region) {
      case 'US': // USA
      case 'LR': // Liberia
      case 'MM': // Myanmar
        return false;
    }
    return true;
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
    // There is no way to obtain the current region, as is possible on native.
    // Instead, use the country-code from the locale when possible (e.g. "en-US").
    const { locale } = this;
    const [, ...suffixes] = typeof locale === 'string' ? locale.split('-') : [];
    for (const suffix of suffixes) {
      if (suffix.length === 2) {
        return suffix.toUpperCase();
      }
    }
    return null;
  },
  async getLocalizationAsync(): Promise<Localization> {
    const {
      currency,
      decimalSeparator,
      digitGroupingSeparator,
      isoCurrencyCodes,
      isMetric,
      isRTL,
      locale,
      locales,
      region,
      timezone,
    } = this;
    return {
      currency,
      decimalSeparator,
      digitGroupingSeparator,
      isoCurrencyCodes,
      isMetric,
      isRTL,
      locale,
      locales,
      region,
      timezone,
    };
  },
};
