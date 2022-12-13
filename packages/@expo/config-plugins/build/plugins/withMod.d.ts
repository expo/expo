import { ExportedConfig, Mod, ModPlatform } from '../Plugin.types';
export type BaseModOptions = {
    platform: ModPlatform;
    mod: string;
    isProvider?: boolean;
    skipEmptyMod?: boolean;
    saveToInternal?: boolean;
    /**
     * If the mod supports introspection, and avoids making any filesystem modifications during compilation.
     * By enabling, this mod, and all of its descendants will be run in introspection mode.
     * This should only be used for static files like JSON or XML, and not for application files that require regexes,
     * or complex static files that require other files to be generated like Xcode `.pbxproj`.
     */
    isIntrospective?: boolean;
};
/**
 * Plugin to intercept execution of a given `mod` with the given `action`.
 * If an action was already set on the given `config` config for `mod`, then it
 * will be provided to the `action` as `nextMod` when it's evaluated, otherwise
 * `nextMod` will be an identity function.
 *
 * @param config exported config
 * @param platform platform to target (ios or android)
 * @param mod name of the platform function to intercept
 * @param skipEmptyMod should skip running the action if there is no existing mod to intercept
 * @param saveToInternal should save the results to `_internal.modResults`, only enable this when the results are pure JSON.
 * @param isProvider should provide data up to the other mods.
 * @param action method to run on the mod when the config is compiled
 */
export declare function withBaseMod<T>(config: ExportedConfig, { platform, mod, action, skipEmptyMod, isProvider, isIntrospective, saveToInternal, }: BaseModOptions & {
    action: Mod<T>;
}): ExportedConfig;
/**
 * Plugin to extend a mod function in the plugins config.
 *
 * @param config exported config
 * @param platform platform to target (ios or android)
 * @param mod name of the platform function to extend
 * @param action method to run on the mod when the config is compiled
 */
export declare function withMod<T>(config: ExportedConfig, { platform, mod, action, }: {
    platform: ModPlatform;
    mod: string;
    action: Mod<T>;
}): ExportedConfig;
