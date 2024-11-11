import type { ExpoConfig } from 'expo/config';
export type WithExpoLocalization = {
    supportsRTL?: boolean;
    forcesRTL?: boolean;
    allowDynamicLocaleChangesAndroid?: boolean;
};
/**
 * @deprecated use `WithExpoLocalization` instead
 */
export type ConfigPluginProps = WithExpoLocalization;
declare function withExpoLocalization(config: ExpoConfig, data?: WithExpoLocalization): ExpoConfig;
export default withExpoLocalization;
