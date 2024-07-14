import type { ExpoConfig } from '@expo/config-types';
import type { JSONObject } from '@expo/json-file';
import type { XcodeProject } from 'xcode';

import { withMod } from './withMod';
import type { ConfigPlugin, Mod } from '../Plugin.types';
import type { ExpoPlist, InfoPlist } from '../ios/IosConfig.types';
import type { AppDelegateProjectFile, PodfileProjectFile } from '../ios/Paths';
import { PluginError } from '../utils/errors';
import { get } from '../utils/obj';
import { addWarningIOS } from '../utils/warnings';

type MutateInfoPlistAction = (
  expo: ExpoConfig,
  infoPlist: InfoPlist
) => Promise<InfoPlist> | InfoPlist;

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export const createInfoPlistPlugin =
  (applePlatform: 'ios' | 'macos') =>
  (action: MutateInfoPlistAction, name?: string): ConfigPlugin => {
    const withInfoPlistForPlatform = withInfoPlist(applePlatform);

    const withUnknown: ConfigPlugin = (config) =>
      withInfoPlistForPlatform(config, async (config) => {
        config.modResults = await action(config, config.modResults);
        return config;
      });
    if (name) {
      Object.defineProperty(withUnknown, 'name', {
        value: name,
      });
    }
    return withUnknown;
  };

export const createInfoPlistPluginWithPropertyGuard =
  (applePlatform: 'ios' | 'macos') =>
  (
    action: MutateInfoPlistAction,
    settings: {
      infoPlistProperty: string;
      expoConfigProperty: string;
      expoPropertyGetter?: (config: ExpoConfig) => string;
    },
    name?: string
  ): ConfigPlugin => {
    const withInfoPlistForPlatform = withInfoPlist(applePlatform);

    const withUnknown: ConfigPlugin = (config) =>
      withInfoPlistForPlatform(config, async (config) => {
        const existingProperty = settings.expoPropertyGetter
          ? settings.expoPropertyGetter(config)
          : get(config, settings.expoConfigProperty);
        // If the user explicitly sets a value in the infoPlist, we should respect that.
        if (
          config.modRawConfig[applePlatform]?.infoPlist?.[settings.infoPlistProperty] === undefined
        ) {
          config.modResults = await action(config, config.modResults);
        } else if (existingProperty !== undefined) {
          // Only warn if there is a conflict.
          switch (applePlatform) {
            case 'ios':
              addWarningIOS(
                settings.expoConfigProperty,
                `"${applePlatform}.infoPlist.${settings.infoPlistProperty}" is set in the config. Ignoring abstract property "${settings.expoConfigProperty}": ${existingProperty}`
              );
              break;
            case 'macos':
              addWarningIOS(
                settings.expoConfigProperty,
                `"${applePlatform}.infoPlist.${settings.infoPlistProperty}" is set in the config. Ignoring abstract property "${settings.expoConfigProperty}": ${existingProperty}`
              );
              break;

            default:
              throw new PluginError(
                `Unsupported platform: ${applePlatform}`,
                'UNSUPPORTED_PLATFORM'
              );
          }
        }

        return config;
      });
    if (name) {
      Object.defineProperty(withUnknown, 'name', {
        value: name,
      });
    }
    return withUnknown;
  };

type MutateEntitlementsPlistAction = (expo: ExpoConfig, entitlements: JSONObject) => JSONObject;

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export const createEntitlementsPlugin =
  (applePlatform: 'ios' | 'macos') =>
  (action: MutateEntitlementsPlistAction, name: string): ConfigPlugin => {
    const withEntitlementsPlistForPlatform = withEntitlementsPlist(applePlatform);

    const withUnknown: ConfigPlugin = (config) =>
      withEntitlementsPlistForPlatform(config, async (config) => {
        config.modResults = await action(config, config.modResults);
        return config;
      });
    if (name) {
      Object.defineProperty(withUnknown, 'name', {
        value: name,
      });
    }
    return withUnknown;
  };

/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
export const withAppDelegate: (
  applePlatform: 'ios' | 'macos'
) => ConfigPlugin<Mod<AppDelegateProjectFile>> =
  (applePlatform: 'ios' | 'macos') => (config, action) => {
    return withMod(config, {
      platform: applePlatform,
      mod: 'appDelegate',
      action,
    });
  };

/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.ios.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
export const withInfoPlist: (applePlatform: 'ios' | 'macos') => ConfigPlugin<Mod<InfoPlist>> =
  (applePlatform: 'ios' | 'macos') => (config, action) => {
    return withMod<InfoPlist>(config, {
      platform: applePlatform,
      mod: 'infoPlist',
      async action(config) {
        config = await action(config);
        if (!config[applePlatform]) {
          config[applePlatform] = {};
        }
        config[applePlatform]!.infoPlist = config.modResults;
        return config;
      },
    });
  };

/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.ios.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
export const withEntitlementsPlist: (
  applePlatform: 'ios' | 'macos'
) => ConfigPlugin<Mod<JSONObject>> = (applePlatform: 'ios' | 'macos') => (config, action) => {
  return withMod<JSONObject>(config, {
    platform: applePlatform,
    mod: 'entitlements',
    async action(config) {
      config = await action(config);
      if (!config[applePlatform]) {
        config[applePlatform] = {};
      }
      config[applePlatform]!.entitlements = config.modResults;
      return config;
    },
  });
};

/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
export const withExpoPlist: (applePlatform: 'ios' | 'macos') => ConfigPlugin<Mod<ExpoPlist>> =
  (applePlatform: 'ios' | 'macos') => (config, action) => {
    return withMod(config, {
      platform: applePlatform,
      mod: 'expoPlist',
      action,
    });
  };

/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
export const withXcodeProject: (
  applePlatform: 'ios' | 'macos'
) => ConfigPlugin<Mod<XcodeProject>> = (applePlatform: 'ios' | 'macos') => (config, action) => {
  return withMod(config, {
    platform: applePlatform,
    mod: 'xcodeproj',
    action,
  });
};

/**
 * Provides the Podfile for modification.
 *
 * @param config
 * @param action
 */
export const withPodfile: (
  applePlatform: 'ios' | 'macos'
) => ConfigPlugin<Mod<PodfileProjectFile>> =
  (applePlatform: 'ios' | 'macos') => (config, action) => {
    return withMod(config, {
      platform: applePlatform,
      mod: 'podfile',
      action,
    });
  };

/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
export const withPodfileProperties: (
  applePlatform: 'ios' | 'macos'
) => ConfigPlugin<Mod<Record<string, string>>> =
  (applePlatform: 'ios' | 'macos') => (config, action) => {
    return withMod(config, {
      platform: applePlatform,
      mod: 'podfileProperties',
      action,
    });
  };
