import { ConfigPlugin, ExportedConfigWithProps, AndroidConfig } from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';
export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
export type GradlePropertiesConfig = ExportedConfigWithProps<AndroidConfig.Properties.PropertiesItem[]>;
export declare const withEdgeToEdge: ConfigPlugin<{
    projectRoot: string;
}>;
export declare function applyEdgeToEdge(config: ExpoConfig, projectRoot: string): ExpoConfig;
export default withEdgeToEdge;
