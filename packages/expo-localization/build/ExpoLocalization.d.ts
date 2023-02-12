import { Localization, Calendar, Locale } from './Localization.types';
declare const _default: {
    readonly currency: string | null;
    readonly decimalSeparator: string;
    readonly digitGroupingSeparator: string;
    readonly isRTL: boolean;
    readonly isMetric: boolean;
    readonly locale: string;
    readonly locales: string[];
    readonly timezone: string;
    readonly isoCurrencyCodes: string[];
    readonly region: string | null;
    getLocales(): Locale[];
    getCalendars(): Calendar[];
    getLocalizationAsync(): Promise<Omit<Localization, 'getCalendars' | 'getLocales'>>;
};
export default _default;
//# sourceMappingURL=ExpoLocalization.d.ts.map