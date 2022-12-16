import { ExportedConfig, ModPlatform } from '../Plugin.types';
import { ForwardedBaseModOptions } from './createBaseMod';
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
}): Promise<ExportedConfig>;
/**
 * A generic plugin compiler.
 *
 * @param config
 */
export declare function evalModsAsync(config: ExportedConfig, { projectRoot, introspect, platforms, 
/**
 * Throw errors when mods are missing providers.
 * @default true
 */
assertMissingModProviders, }: {
    projectRoot: string;
    introspect?: boolean;
    assertMissingModProviders?: boolean;
    platforms?: ModPlatform[];
}): Promise<ExportedConfig>;
