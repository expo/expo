import { ForwardedBaseModOptions } from './createBaseMod';
import { ExportedConfig, ModPlatform } from '../Plugin.types';
export declare function withDefaultBaseMods(config: ExportedConfig, props?: ForwardedBaseModOptions): ExportedConfig;
/**
 * Get a prebuild config that safely evaluates mods without persisting any changes to the file system.
 * Currently this only supports infoPlist, entitlements, androidManifest, strings, gradleProperties, and expoPlist mods.
 * This plugin should be evaluated directly:
 */
export declare function withIntrospectionBaseMods(config: ExportedConfig, props?: ForwardedBaseModOptions): ExportedConfig;
/**
 *
 * @param projectRoot
 * @param config
 */
export declare function compileModsAsync(config: ExportedConfig, props: {
    projectRoot: string;
    platforms?: ModPlatform[];
    introspect?: boolean;
    assertMissingModProviders?: boolean;
    ignoreExistingNativeFiles?: boolean;
}): Promise<ExportedConfig>;
export declare function sortMods(commands: [string, any][], precedences: Record<string, number>): [string, any][];
/**
 * A generic plugin compiler.
 *
 * @param config
 */
export declare function evalModsAsync(config: ExportedConfig, { projectRoot, introspect, platforms, assertMissingModProviders, ignoreExistingNativeFiles, }: {
    projectRoot: string;
    introspect?: boolean;
    platforms?: ModPlatform[];
    /**
     * Throw errors when mods are missing providers.
     * @default true
     */
    assertMissingModProviders?: boolean;
    /** Ignore any existing native files, only use the generated prebuild results. */
    ignoreExistingNativeFiles?: boolean;
}): Promise<ExportedConfig>;
