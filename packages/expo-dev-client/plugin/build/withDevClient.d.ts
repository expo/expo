import type { PluginConfigType } from 'expo-dev-launcher/plugin';
export type DevClientPluginConfigType = PluginConfigType & {
    /**
     * Whether to register a custom URL scheme to open a project.
     * @default true
     */
    addGeneratedScheme?: boolean;
};
declare const _default: import("expo/config-plugins").ConfigPlugin<DevClientPluginConfigType>;
export default _default;
