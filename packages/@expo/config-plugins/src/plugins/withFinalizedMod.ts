import type { ConfigPlugin, Mod, ModPlatform } from '../Plugin.types';
import { withMod } from './withMod';

/**
 * Mods that don't modify any data, all unresolved functionality is performed inside a finalized mod.
 * All finalized mods run after all the other mods.
 *
 * @param config
 * @param platform
 * @param action
 */
export const withFinalizedMod: ConfigPlugin<[ModPlatform, Mod<unknown>]> = (
  config,
  [platform, action]
) => {
  return withMod(config, {
    platform,
    mod: 'finalized',
    action,
  });
};
