import { Localization } from './Localization.types';
export { Localization };
export declare const locale: string;
export declare const locales: any;
export declare const timezone: any;
export declare const isoCurrencyCodes: any;
export declare const region: any;
export declare const isRTL: any;
export declare function getLocalizationAsync(): Promise<Localization>;
