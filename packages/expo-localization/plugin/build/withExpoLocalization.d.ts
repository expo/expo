import type { ExpoConfig } from 'expo/config';
export type WithExpoLocalizationProps = {
    supportsRTL?: boolean;
    forcesRTL?: boolean;
    allowDynamicLocaleChangesAndroid?: boolean;
};
/**
 * @deprecated use `WithExpoLocalization` instead
 */
export type ConfigPluginProps = WithExpoLocalizationProps;
declare function withExpoLocalization(config: ExpoConfig, data?: WithExpoLocalizationProps): ExpoConfig;
export default withExpoLocalization;
