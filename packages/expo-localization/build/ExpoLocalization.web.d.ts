import { Localization } from './Localization.types';
declare const _default: {
    readonly isRTL: boolean;
    readonly locale: string;
    readonly locales: string[];
    readonly timezone: string;
    readonly isoCurrencyCodes: string[];
    readonly country: string | undefined;
    getLocalizationAsync(): Promise<Localization>;
};
export default _default;
