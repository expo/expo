import type { PluginConfigType } from 'expo-dev-launcher/plugin/build/pluginConfig';
type DevClientPluginConfigType = PluginConfigType & {
    disableDevClientScheme?: boolean;
};
declare const _default: import("expo/config-plugins").ConfigPlugin<DevClientPluginConfigType>;
export default _default;
