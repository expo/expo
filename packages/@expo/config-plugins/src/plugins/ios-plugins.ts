import type { ExpoConfig } from '@expo/config-types';
import type { JSONObject } from '@expo/json-file';
import type { XcodeProject } from 'xcode';

import type { ConfigPlugin, Mod } from '../Plugin.types';
import type { ExpoPlist, InfoPlist } from '../ios/IosConfig.types';
import type { AppDelegateProjectFile } from '../ios/Paths';
import { get } from '../utils/obj';
import { addWarningIOS } from '../utils/warnings';
import { withMod } from './withMod';

type MutateInfoPlistAction = (
  expo: ExpoConfig,
  infoPlist: InfoPlist
) => Promise<InfoPlist> | InfoPlist;

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export function createInfoPlistPlugin(action: MutateInfoPlistAction, name?: string): ConfigPlugin {
  const withUnknown: ConfigPlugin = config =>
    withInfoPlist(config, async config => {
      config.modResults = await action(config, config.modResults);
      return config;
    });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name,
    });
  }
  return withUnknown;
}

export function createInfoPlistPluginWithPropertyGuard(
  action: MutateInfoPlistAction,
  settings: {
    infoPlistProperty: string;
    expoConfigProperty: string;
    expoPropertyGetter?: (config: ExpoConfig) => string;
  },
  name?: string
): ConfigPlugin {
  const withUnknown: ConfigPlugin = config =>
    withInfoPlist(config, async config => {
      const existingProperty = settings.expoPropertyGetter
        ? settings.expoPropertyGetter(config)
        : get(config, settings.expoConfigProperty);
      // If the user explicitly sets a value in the infoPlist, we should respect that.
      if (config.modRawConfig.ios?.infoPlist?.[settings.infoPlistProperty] === undefined) {
        config.modResults = await action(config, config.modResults);
      } else if (existingProperty !== undefined) {
        // Only warn if there is a conflict.
        addWarningIOS(
          settings.expoConfigProperty,
          `"ios.infoPlist.${settings.infoPlistProperty}" is set in the config. Ignoring abstract property "${settings.expoConfigProperty}": ${existingProperty}`
        );
      }

      return config;
    });
  if (name) {
    Object.defineProperty(withUnknown, 'name', {
      value: name,
    });
  }
  return withUnknown;
}

type MutateEntitlementsPlistAction = (expo: ExpoConfig, entitlements: JSONObject) => JSONObject;

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export function createEntitlementsPlugin(
  action: MutateEntitlementsPlistAction,
  name: string
): ConfigPlugin {
  const withUnknown: ConfigPlugin = config =>
    withEntitlementsPlist(config, async config => {
      config.modResults = await action(config, config.modResults);
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
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
export const withAppDelegate: ConfigPlugin<Mod<AppDelegateProjectFile>> = (config, action) => {
  return withMod(config, {
    platform: 'ios',
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
export const withInfoPlist: ConfigPlugin<Mod<InfoPlist>> = (config, action) => {
  return withMod<InfoPlist>(config, {
    platform: 'ios',
    mod: 'infoPlist',
    async action(config) {
      config = await action(config);
      if (!config.ios) {
        config.ios = {};
      }
      config.ios.infoPlist = config.modResults;
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
export const withEntitlementsPlist: ConfigPlugin<Mod<JSONObject>> = (config, action) => {
  return withMod<JSONObject>(config, {
    platform: 'ios',
    mod: 'entitlements',
    async action(config) {
      config = await action(config);
      if (!config.ios) {
        config.ios = {};
      }
      config.ios.entitlements = config.modResults;
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
export const withExpoPlist: ConfigPlugin<Mod<ExpoPlist>> = (config, action) => {
  return withMod(config, {
    platform: 'ios',
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
export const withXcodeProject: ConfigPlugin<Mod<XcodeProject>> = (config, action) => {
  return withMod(config, {
    platform: 'ios',
    mod: 'xcodeproj',
    action,
  });
};

/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
export const withPodfileProperties: ConfigPlugin<Mod<Record<string, string>>> = (
  config,
  action
) => {
  return withMod(config, {
    platform: 'ios',
    mod: 'podfileProperties',
    action,
  });
};
