import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withEdgeToEdge: ConfigPlugin;
export declare const withConfigureEdgeToEdgeEnforcement: ConfigPlugin<{
    disableEdgeToEdgeEnforcement: boolean;
}>;
export declare function withEdgeToEdgeEnabledGradleProperties(config: ExpoConfig, props: {
    edgeToEdgeEnabled: boolean;
}): ExpoConfig;
export declare const withRestoreDefaultTheme: ConfigPlugin;
export declare function hasEnabledEdgeToEdge(config: ExpoConfig): boolean;
export default withEdgeToEdge;
