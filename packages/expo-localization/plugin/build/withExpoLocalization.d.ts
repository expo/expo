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
/**
 * Converts BCP-47 locale strings (e.g., "en-US") to Android resource qualifiers (e.g., "en-rUS").
 * This prevents "invalid config" errors during :processDebugResources.
 */
export declare function convertBcp47ToAndroidLocale(locale: string): string;
declare function withExpoLocalization(config: ExpoConfig, data?: ConfigPluginProps): ExpoConfig;
export default withExpoLocalization;
