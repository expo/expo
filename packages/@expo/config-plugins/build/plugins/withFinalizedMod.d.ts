import { ConfigPlugin, Mod, ModPlatform } from '../Plugin.types';
/**
 * Mods that don't modify any data, all unresolved functionality is performed inside a finalized mod.
 * All finalized mods run after all the other mods.
 *
 * @param config
 * @param platform
 * @param action
 */
export declare const withFinalizedMod: ConfigPlugin<[ModPlatform, Mod<unknown>]>;
