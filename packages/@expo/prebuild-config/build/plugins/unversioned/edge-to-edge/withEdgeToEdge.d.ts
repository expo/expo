import { ConfigPlugin, ExportedConfigWithProps, AndroidConfig } from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';
export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;
export declare const withEdgeToEdge: ConfigPlugin;
export declare function applyEdgeToEdge(config: ExpoConfig): ExpoConfig;
export default withEdgeToEdge;
