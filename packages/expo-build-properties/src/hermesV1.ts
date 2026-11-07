import type { ConfigPlugin, ModProps } from 'expo/config-plugins';
import { withGradleProperties, withPodfileProperties } from 'expo/config-plugins';

// Neither override exists in the standard template; revisit the purge if that changes.
export const IOS_HERMES_V1_PROPERTY = 'expo.useHermesV1';
export const ANDROID_HERMES_V1_PROPERTY = 'hermesV1Enabled';

type HermesModRequest = ModProps & { _expoBuildPropertiesHermesV1Purged?: true };

function shouldPurgeHermesV1(modRequest: ModProps): boolean {
  // Requests carry this state through the chain and are recreated for each evaluation.
  // Keep the field name stable across package copies; additional owned keys need a new marker.
  const request = modRequest as HermesModRequest;
  if (request._expoBuildPropertiesHermesV1Purged === true) return false;
  request._expoBuildPropertiesHermesV1Purged = true;
  return true;
}

export const withIosPurgeHermesV1: ConfigPlugin = (config) =>
  withPodfileProperties(config, (config) => {
    if (shouldPurgeHermesV1(config.modRequest)) {
      delete config.modResults[IOS_HERMES_V1_PROPERTY];
    }
    return config;
  });

export const withAndroidPurgeHermesV1: ConfigPlugin = (config) =>
  withGradleProperties(config, (config) => {
    if (shouldPurgeHermesV1(config.modRequest)) {
      // Manage the '=' forms supported by Expo's parser, including spaces before '='.
      config.modResults = config.modResults.filter(
        (item) => item.type !== 'property' || item.key.trim() !== ANDROID_HERMES_V1_PROPERTY
      );
    }
    return config;
  });
