import type { ExpoConfig } from '@expo/config-types';
import type { PropertiesItem } from './Properties';
import type { ConfigPlugin } from '../Plugin.types';
import { BuildPropertiesConfig, ConfigToPropertyRuleType } from '../utils/BuildProperties.types';
/**
 * Creates a `withGradleProperties` config-plugin based on given config to property mapping rules.
 *
 * The factory supports two modes from generic type inference
 * ```ts
 * // config-plugin without `props`, it will implicitly use the expo config as source config.
 * createBuildGradlePropsConfigPlugin<ExpoConfig>(): ConfigPlugin<void>;
 *
 * // config-plugin with a parameter `props: CustomType`, it will use the `props` as source config.
 * createBuildGradlePropsConfigPlugin<CustomType>(): ConfigPlugin<CustomType>;
 * ```
 *
 * @param configToPropertyRules config to property mapping rules
 * @param name the config plugin name
 */
export declare function createBuildGradlePropsConfigPlugin<SourceConfigType extends BuildPropertiesConfig>(configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[], name?: string): ConfigPlugin<SourceConfigType extends ExpoConfig ? void : SourceConfigType>;
/**
 * A config-plugin to update `android/gradle.properties` from the `jsEngine` in expo config
 */
export declare const withJsEngineGradleProps: ConfigPlugin<void>;
/**
 * A config-plugin to update `android/gradle.properties` from the `newArchEnabled` in expo config
 */
export declare const withNewArchEnabledGradleProps: ConfigPlugin<void>;
export declare function updateAndroidBuildPropertiesFromConfig<SourceConfigType extends BuildPropertiesConfig>(config: SourceConfigType, gradleProperties: PropertiesItem[], configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[]): PropertiesItem[];
export declare function updateAndroidBuildProperty(gradleProperties: PropertiesItem[], name: string, value: string | null | undefined, options?: {
    removePropWhenValueIsNull?: boolean;
}): PropertiesItem[];
