import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';

import { createEntitlements, ShareIntoEntitlements } from './ios/createEntitlements';

function addShareIntoEntitlements(
  existingEntitlements: InfoPlist,
  shareIntoEntitlements?: ShareIntoEntitlements
) {
  if (!shareIntoEntitlements) {
    return existingEntitlements;
  }

  for (const key of Object.keys(shareIntoEntitlements)) {
    const itemsToAdd = shareIntoEntitlements[key];
    const existingValue = existingEntitlements[key] ?? [];

    if (!Array.isArray(existingValue)) {
      // Users should never see this error, if you encounter it during development you most likely need to write parsing for the provided type below.
      throw new Error('Expo-sharing plugin cannot handle this entitlement. Update the plugin.');
    }

    const typedExistingValue = existingValue as string[];

    for (const item of itemsToAdd) {
      if (!typedExistingValue.includes(item)) {
        typedExistingValue.push(item);
      }
    }

    existingEntitlements[key] = typedExistingValue;
  }

  return existingEntitlements;
}

export const withConfig: ConfigPlugin<{
  bundleIdentifier: string;
  targetName: string;
  groupIdentifier: string;
}> = (config, { bundleIdentifier, targetName, groupIdentifier }) => {
  let configIndex: null | number = null;
  config.extra?.eas?.build?.experimental?.ios?.appExtensions?.forEach((ext: any, index: number) => {
    if (ext.targetName === targetName) {
      configIndex = index;
    }
  });

  if (configIndex === null) {
    config.extra = {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        build: {
          ...config.extra?.eas?.build,
          experimental: {
            ...config.extra?.eas?.build?.experimental,
            ios: {
              ...config.extra?.eas?.build?.experimental?.ios,
              appExtensions: [
                ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? []),
                {
                  targetName,
                  bundleIdentifier,
                  entitlements: [],
                },
              ],
            },
          },
        },
      },
    };
    configIndex = 0;
  }

  if (config.extra) {
    const widgetsExtensionConfig =
      config.extra.eas.build.experimental.ios.appExtensions[configIndex];

    const shareIntoEntitlements = createEntitlements(groupIdentifier);

    addShareIntoEntitlements(widgetsExtensionConfig.entitlements, shareIntoEntitlements);

    if (!config.ios) {
      throw new Error(
        'Expo-sharing: the ios config is missing. The project is not configured correctly.'
      );
    }
    if (!config.ios?.entitlements) {
      config.ios = {
        ...config.ios,
        entitlements: {},
      };
    }

    addShareIntoEntitlements(config.ios?.entitlements as InfoPlist, shareIntoEntitlements);
  }

  return config;
};
