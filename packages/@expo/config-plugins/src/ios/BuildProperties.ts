import type { ExpoConfig } from '@expo/config-types';

import type { ConfigPlugin } from '../Plugin.types';
import { withPodfileProperties } from '../plugins/ios-plugins';
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
export function createBuildPodfilePropsConfigPlugin<SourceConfigType extends BuildPropertiesConfig>(
  configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[],
  name?: string
) {
  const withUnknown: ConfigPlugin<SourceConfigType extends ExpoConfig ? void : SourceConfigType> = (
    config,
    sourceConfig
  ) =>
    withPodfileProperties(config, config => {
      config.modResults = updateIosBuildPropertiesFromConfig(
        (sourceConfig ?? config) as SourceConfigType,
        config.modResults,
        configToPropertyRules
      );
      return config;
    });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name,
    });
  }
  return withUnknown;
}

/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
export const withJsEnginePodfileProps = createBuildPodfilePropsConfigPlugin<ExpoConfig>(
  [
    {
      propName: 'expo.jsEngine',
      propValueGetter: config => config.ios?.jsEngine ?? config.jsEngine ?? 'jsc',
    },
  ],
  'withJsEnginePodfileProps'
);

export function updateIosBuildPropertiesFromConfig<SourceConfigType extends BuildPropertiesConfig>(
  config: SourceConfigType,
  podfileProperties: Record<string, string>,
  configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[]
) {
  for (const configToProperty of configToPropertyRules) {
    const value = configToProperty.propValueGetter(config);
    updateIosBuildProperty(podfileProperties, configToProperty.propName, value);
  }
  return podfileProperties;
}

export function updateIosBuildProperty(
  podfileProperties: Record<string, string>,
  name: string,
  value: string | null | undefined,
  options?: { removePropWhenValueIsNull?: boolean }
) {
  if (value) {
    podfileProperties[name] = value;
  } else if (options?.removePropWhenValueIsNull) {
    delete podfileProperties[name];
  }
  return podfileProperties;
}
