import { ConfigPlugin, Mod, ModPlatform } from '../Plugin.types';
/**
 * Mods that don't modify any data, all unresolved functionality is performed inside a dangerous mod.
 * All dangerous mods run first before other mods.
 *
 * @param config
 * @param platform
 * @param action
 */
export declare const withDangerousMod: ConfigPlugin<[ModPlatform, Mod<unknown>]>;
