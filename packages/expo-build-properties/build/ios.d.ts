import type { ConfigPlugin } from 'expo/config-plugins';
import type { PluginConfigType } from './pluginConfig';
export declare const withIosBuildProperties: ConfigPlugin<PluginConfigType>;
/** @deprecated use built-in `ios.deploymentTarget` property instead. */
export declare const withIosDeploymentTarget: ConfigPlugin<PluginConfigType>;
export declare const withIosInfoPlist: ConfigPlugin<PluginConfigType>;
