import type { ExpoConfig } from 'expo/config';
type ConfigPluginProps = {
    supportsRTL?: boolean;
    forcesRTL?: boolean;
    allowDynamicLocaleChangesAndroid?: boolean;
    supportedLocales?: string[] | {
        ios?: string[];
        android?: string[];
    };
};
export declare function convertBcp47ToResourceQualifier(locale: string): string;
declare function withExpoLocalization(config: ExpoConfig, data?: ConfigPluginProps): ExpoConfig;
export default withExpoLocalization;
