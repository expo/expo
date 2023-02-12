import { ConfigPlugin, Mod, ModPlatform } from '../Plugin.types';
import { withMod } from './withMod';

/**
 * Mods that don't modify any data, all unresolved functionality is performed inside a dangerous mod.
 * All dangerous mods run first before other mods.
 *
 * @param config
 * @param platform
 * @param action
 */
export const withDangerousMod: ConfigPlugin<[ModPlatform, Mod<unknown>]> = (
  config,
  [platform, action]
) => {
  return withMod(config, {
    platform,
    mod: 'dangerous',
    action,
  });
};
