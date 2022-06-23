import type { ExpoConfig } from '@expo/config-types';

import type { ConfigPlugin } from '../Plugin.types';
import { withGradleProperties } from '../plugins/android-plugins';
import { BuildPropertiesConfig, ConfigToPropertyRuleType } from '../utils/BuildProperties.types';
import type { PropertiesItem } from './Properties';

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
export function createBuildGradlePropsConfigPlugin<SourceConfigType extends BuildPropertiesConfig>(
  configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[],
  name?: string
) {
  const withUnknown: ConfigPlugin<SourceConfigType extends ExpoConfig ? void : SourceConfigType> = (
    config,
    sourceConfig
  ) =>
    withGradleProperties(config, config => {
      config.modResults = updateAndroidBuildPropertiesFromConfig(
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
 * A config-plugin to update `android/gradle.properties` from the `jsEngine` in expo config
 */
export const withJsEngineGradleProps = createBuildGradlePropsConfigPlugin<ExpoConfig>(
  [
    {
      propName: 'expo.jsEngine',
      propValueGetter: config => config.android?.jsEngine ?? config.jsEngine ?? 'jsc',
    },
  ],
  'withJsEngineGradleProps'
);

export function updateAndroidBuildPropertiesFromConfig<
  SourceConfigType extends BuildPropertiesConfig
>(
  config: SourceConfigType,
  gradleProperties: PropertiesItem[],
  configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[]
) {
  for (const configToProperty of configToPropertyRules) {
    const value = configToProperty.propValueGetter(config);
    updateAndroidBuildProperty(gradleProperties, configToProperty.propName, value);
  }

  return gradleProperties;
}

export function updateAndroidBuildProperty(
  gradleProperties: PropertiesItem[],
  name: string,
  value: string | null | undefined,
  options?: { removePropWhenValueIsNull?: boolean }
) {
  const oldPropIndex = gradleProperties.findIndex(
    prop => prop.type === 'property' && prop.key === name
  );

  if (value) {
    // found the matched value, add or merge new property
    const newProp: PropertiesItem = {
      type: 'property',
      key: name,
      value,
    };

    if (oldPropIndex >= 0) {
      gradleProperties[oldPropIndex] = newProp;
    } else {
      gradleProperties.push(newProp);
    }
  } else if (options?.removePropWhenValueIsNull && oldPropIndex >= 0) {
    gradleProperties.splice(oldPropIndex, 1);
  }

  return gradleProperties;
}
