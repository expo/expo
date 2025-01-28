import type { ExpoConfig } from '@expo/config-types';

import type { PropertiesItem } from './Properties';
import type { ConfigPlugin } from '../Plugin.types';
import { withGradleProperties } from '../plugins/android-plugins';
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
export function createBuildGradlePropsConfigPlugin<SourceConfigType extends BuildPropertiesConfig>(
  configToPropertyRules: ConfigToPropertyRuleType<SourceConfigType>[],
  name?: string
) {
  const withUnknown: ConfigPlugin<SourceConfigType extends ExpoConfig ? void : SourceConfigType> = (
    config,
    sourceConfig
  ) =>
    withGradleProperties(config, (config) => {
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
      propName: 'hermesEnabled',
      propValueGetter: (config) =>
        ((config.android?.jsEngine ?? config.jsEngine ?? 'hermes') === 'hermes').toString(),
    },
  ],
  'withJsEngineGradleProps'
);

/**
 * A config-plugin to update `android/gradle.properties` from the `newArchEnabled` in expo config
 */
export const withNewArchEnabledGradleProps = createBuildGradlePropsConfigPlugin<ExpoConfig>(
  [
    {
      propName: 'newArchEnabled',
      propValueGetter: (config) =>
        (config.android?.newArchEnabled ?? config.newArchEnabled ?? false).toString(),
    },
  ],
  'withNewArchEnabledGradleProps'
);

export function updateAndroidBuildPropertiesFromConfig<
  SourceConfigType extends BuildPropertiesConfig,
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
    (prop) => prop.type === 'property' && prop.key === name
  );
  const oldProp = oldPropIndex >= 0 ? gradleProperties[oldPropIndex] : null;
  if (value) {
    // found the matched value, add or merge new property
    const newProp: PropertiesItem = {
      type: 'property',
      key: name,
      value,
    };

    if (oldProp && oldProp.type === 'property') {
      try {
        const prevValue = JSON.parse(oldProp.value);
        const newValue = JSON.parse(value);
        if (Array.isArray(prevValue) && Array.isArray(newValue)) {
          const prevArrayWithStringifiedValues = prevValue.map((v) => JSON.stringify(v));
          const newArrayWithStringifiedValues = newValue.map((v) => JSON.stringify(v));
          const mergedValues = [
            ...new Set([...prevArrayWithStringifiedValues, ...newArrayWithStringifiedValues]),
          ].map((v) => JSON.parse(v));
          oldProp.value = JSON.stringify(mergedValues);
          return gradleProperties;
        }
      } catch {}
      oldProp.value = value;
      return gradleProperties;
    }

    gradleProperties.push(newProp);
    return gradleProperties;
  }
  if (options?.removePropWhenValueIsNull && oldPropIndex >= 0) {
    gradleProperties.splice(oldPropIndex, 1);
    return gradleProperties;
  }

  return gradleProperties;
}
