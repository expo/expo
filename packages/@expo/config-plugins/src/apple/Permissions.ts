import Debug from 'debug';

import { InfoPlist } from './AppleConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { withInfoPlist } from '../plugins/apple-plugins';

const debug = Debug(`expo:config-plugins:apple:permissions`);

export const applyPermissions = <Defaults extends Record<string, string> = Record<string, string>>(
  defaults: Defaults,
  permissions: Partial<Record<keyof Defaults, string | false>>,
  infoPlist: InfoPlist
): InfoPlist => {
  const entries = Object.entries(defaults);
  if (entries.length === 0) {
    debug(`No defaults provided: ${JSON.stringify(permissions)}`);
  }
  for (const [permission, description] of entries) {
    if (permissions[permission] === false) {
      debug(`Deleting "${permission}"`);
      delete infoPlist[permission];
    } else {
      infoPlist[permission] = permissions[permission] || infoPlist[permission] || description;
      debug(`Setting "${permission}" to "${infoPlist[permission]}"`);
    }
  }
  return infoPlist;
};

/**
 * Helper method for creating mods to apply default permissions.
 *
 * @param action
 */
export const createPermissionsPlugin =
  (applePlatform: 'ios' | 'macos') =>
  <Defaults extends Record<string, string> = Record<string, string>>(
    defaults: Defaults,
    name?: string
  ) => {
    const withApplePermissions: ConfigPlugin<Record<keyof Defaults, string | undefined | false>> = (
      config,
      permissions
    ) =>
      withInfoPlist(applePlatform)(config, async (config) => {
        config.modResults = applyPermissions(defaults, permissions, config.modResults);
        return config;
      });
    if (name) {
      Object.defineProperty(withApplePermissions, 'name', {
        value: name,
      });
    }
    return withApplePermissions;
  };
