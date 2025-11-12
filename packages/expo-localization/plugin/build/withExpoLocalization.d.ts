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
 * Converts locale strings to BCP-47 format.
 */
export declare function convertLocaleToBcp47(locale: string): string;
declare function withExpoLocalization(config: ExpoConfig, data?: ConfigPluginProps): ExpoConfig;
export default withExpoLocalization;
