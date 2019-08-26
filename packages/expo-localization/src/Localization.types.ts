export type Localization = {
  locale: string;
  locales: string[];
  timezone: string;
  isoCurrencyCodes?: string[];
  region?: string; // iOS
  isRTL: boolean;
};
