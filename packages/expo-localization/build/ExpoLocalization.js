/* eslint-env browser */
import { Platform } from '@unimodules/core';
import * as rtlDetect from 'rtl-detect';
export default {
    get isRTL() {
        return rtlDetect.isRtlLang(this.locale) ?? false;
    },
    get locale() {
        if (!Platform.isDOMAvailable) {
            return '';
        }
        const locale = navigator.language ||
            navigator['systemLanguage'] ||
            navigator['browserLanguage'] ||
            navigator['userLanguage'] ||
            this.locales[0];
        return locale;
    },
    get locales() {
        if (!Platform.isDOMAvailable) {
            return [];
        }
        const { languages = [] } = navigator;
        return Array.from(languages);
    },
    get timezone() {
        const defaultTimeZone = 'Etc/UTC';
        if (typeof Intl === 'undefined') {
            return defaultTimeZone;
        }
        return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimeZone;
    },
    get isoCurrencyCodes() {
        // TODO(Bacon): Add this - very low priority
        return [];
    },
    get region() {
        const { locale } = this;
        if (typeof locale === 'string' && locale.length) {
            const isoCountryCode = locale.substring(locale.lastIndexOf('-') + 1);
            return isoCountryCode.toUpperCase();
        }
        return null;
    },
    async getLocalizationAsync() {
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
//# sourceMappingURL=ExpoLocalization.js.map