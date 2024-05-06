import { ExpoConfig } from '@expo/config-types';
type ConfigPluginProps = {
    supportsRTL?: boolean;
    forcesRTL?: boolean;
    allowDynamicLocaleChangesAndroid?: boolean;
};
declare function withExpoLocalization(config: ExpoConfig, data?: ConfigPluginProps): ExpoConfig;
export default withExpoLocalization;
