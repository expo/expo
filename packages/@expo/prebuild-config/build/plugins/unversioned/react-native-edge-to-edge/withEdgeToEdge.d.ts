import { ConfigPlugin, ExportedConfigWithProps, AndroidConfig } from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';
export type EdgeToEdgePlugin = ConfigPlugin<{
    android: {
        parentTheme?: string;
        enforceNavigationBarContrast?: boolean;
    };
}>;
export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
export type GradlePropertiesConfig = ExportedConfigWithProps<AndroidConfig.Properties.PropertiesItem[]>;
export declare const withEdgeToEdge: ConfigPlugin;
export declare function applyEdgeToEdge(config: ExpoConfig): ExpoConfig;
export default withEdgeToEdge;
