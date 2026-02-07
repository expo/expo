import { ConfigPlugin } from 'expo/config-plugins';

type EasConfigProps = {
  targetName: string;
  bundleIdentifier: string;
  groupIdentifier: string;
};

/**
 * Registers the widget extension target with EAS Build so that it can
 * automatically create and configure the App ID in Apple Developer Portal,
 * enable the App Groups capability, and manage provisioning profiles.
 */
const withEasConfig: ConfigPlugin<EasConfigProps> = (
  config,
  { targetName, bundleIdentifier, groupIdentifier }
) => {
  let configIndex: null | number = null;
  config.extra?.eas?.build?.experimental?.ios?.appExtensions?.forEach(
    (ext: any, index: number) => {
      if (ext.targetName === targetName) {
        configIndex = index;
      }
    }
  );

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
                  entitlements: {
                    'com.apple.security.application-groups': [groupIdentifier],
                  },
                },
              ],
            },
          },
        },
      },
    };
  } else if (config.extra) {
    // Ensure the entitlements are up to date for an existing entry
    const existingEntry =
      config.extra.eas.build.experimental.ios.appExtensions[configIndex];
    const existingGroups =
      (existingEntry.entitlements?.['com.apple.security.application-groups'] as string[]) ?? [];
    if (!existingGroups.includes(groupIdentifier)) {
      existingEntry.entitlements = {
        ...existingEntry.entitlements,
        'com.apple.security.application-groups': [groupIdentifier, ...existingGroups],
      };
    }
  }

  return config;
};

export default withEasConfig;
