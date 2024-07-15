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
export declare const createBuildPodfilePropsConfigPlugin: <SourceConfigType extends import("../utils/BuildProperties.types").BuildPropertiesConfig>(configToPropertyRules: import("../utils/BuildProperties.types").ConfigToPropertyRuleType<SourceConfigType>[], name?: string | undefined) => import("..").ConfigPlugin<SourceConfigType extends import("@expo/config-types").ExpoConfig ? void : SourceConfigType>;
/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
export declare const withJsEnginePodfileProps: import("..").ConfigPlugin<void>;
export { updateAppleBuildPropertiesFromConfig as updateIosBuildPropertiesFromConfig, updateAppleBuildProperty as updateIosBuildProperty, } from '../apple/BuildProperties';
