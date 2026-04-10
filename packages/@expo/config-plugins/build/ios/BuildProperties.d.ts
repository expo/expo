import type { ExpoConfig } from '@expo/config-types';
import type { ConfigPlugin } from '../Plugin.types';
import { BuildPropertiesConfig, ConfigToPropertyRuleType } from '../utils/BuildProperties.types';
/**
 * Creates a `withPodfileProperties` config-plugin based on given config to property mapping rules.
 *
 * The factory supports two modes from generic type inference
 * ```ts
 * // config-plugin without `props`, it will implicitly use the expo config as source config.
 * createBuildPodfilePropsConfigPlugin<ExpoConfig>(): ConfigPlugin<void>;
 *
 * // config-plugin with a parameter `props: CustomType`, it will use the `props` as source config.
 * createBuildPodfilePropsConfigPlugin<CustomType>(): ConfigPlugin<CustomType>;
 * ```
 *
 * @param configToPropertyRules config to property mapping rules
 * @param name the config plugin name
 */
export declare function createBuildPodfilePropsConfigPlugin<SourceConfigType extends BuildPropertiesConfig>(configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[], name?: string): ConfigPlugin<SourceConfigType extends ExpoConfig ? void : SourceConfigType>;
/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
export declare const withJsEnginePodfileProps: ConfigPlugin<void>;
export declare function updateIosBuildPropertiesFromConfig<SourceConfigType extends BuildPropertiesConfig>(config: SourceConfigType, podfileProperties: Record<string, string>, configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[]): Record<string, string>;
export declare function updateIosBuildProperty(podfileProperties: Record<string, string>, name: string, value: string | null | undefined, options?: {
    removePropWhenValueIsNull?: boolean;
}): Record<string, string>;
