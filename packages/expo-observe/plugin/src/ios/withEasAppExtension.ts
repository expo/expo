import { ConfigPlugin } from 'expo/config-plugins';

type AppExtension = {
  targetName: string;
  bundleIdentifier?: string;
  entitlements?: Record<string, unknown>;
};

type EasAppExtensionProps = {
  targetName: string;
  bundleIdentifier: string;
};

/**
 * Registers the extension target with EAS Build, so that EAS credentials create and sign its
 * provisioning profile.
 */
const withEasAppExtension: ConfigPlugin<EasAppExtensionProps> = (
  config,
  { targetName, bundleIdentifier }
) => {
  const ios = config.extra?.eas?.build?.experimental?.ios ?? {};
  const appExtensions: AppExtension[] = ios.appExtensions ?? [];
  const existing = appExtensions.find((appExtension) => appExtension.targetName === targetName);
  // Keep entitlements that are already registered for the extension, for example ones added by
  // hand in the app config.
  const appExtension = {
    ...existing,
    targetName,
    bundleIdentifier,
    entitlements: existing?.entitlements ?? {},
  };

  config.extra = {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...ios,
            appExtensions: existing
              ? appExtensions.map((entry) => (entry === existing ? appExtension : entry))
              : [...appExtensions, appExtension],
          },
        },
      },
    },
  };
  return config;
};

export default withEasAppExtension;
