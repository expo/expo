import { ConfigPlugin, ExportedConfigWithProps, AndroidConfig } from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';
type EdgeToEdgePlugin = ConfigPlugin<{
    android: {
        parentTheme?: string;
        enforceNavigationBarContrast?: boolean;
    };
}>;
type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
type GradlePropertiesConfig = ExportedConfigWithProps<AndroidConfig.Properties.PropertiesItem[]>;
export declare const withEdgeToEdge: ConfigPlugin;
export declare function applyEdgeToEdge(config: ExpoConfig): ExpoConfig;
export declare const withConfigureEdgeToEdgeEnforcement: ConfigPlugin<{
    disableEdgeToEdgeEnforcement: boolean;
}>;
export declare function configureEdgeToEdgeEnforcement(config: ResourceXMLConfig, disableEdgeToEdgeEnforcement: boolean): ResourceXMLConfig;
export declare function withEdgeToEdgeEnabledGradleProperties(config: ExpoConfig, props: {
    edgeToEdgeEnabled: boolean;
}): ExpoConfig;
export declare function configureEdgeToEdgeEnabledGradleProperties(config: GradlePropertiesConfig, edgeToEdgeEnabled: boolean): GradlePropertiesConfig;
export declare const withRestoreDefaultTheme: ConfigPlugin;
export declare function restoreDefaultTheme(config: ResourceXMLConfig): ResourceXMLConfig;
export declare function hasEnabledEdgeToEdge(config: ExpoConfig): boolean;
export declare function loadEdgeToEdgeConfigPlugin(): EdgeToEdgePlugin | null;
export default withEdgeToEdge;
