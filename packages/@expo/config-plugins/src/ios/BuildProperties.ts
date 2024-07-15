import * as AppleImpl from '../apple/BuildProperties';

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
export const createBuildPodfilePropsConfigPlugin = AppleImpl.createBuildPodfilePropsConfigPlugin('ios');

/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
export const withJsEnginePodfileProps = AppleImpl.withJsEnginePodfileProps('ios');

export {
  updateAppleBuildPropertiesFromConfig as updateIosBuildPropertiesFromConfig,
  updateAppleBuildProperty as updateIosBuildProperty,
} from '../apple/BuildProperties';