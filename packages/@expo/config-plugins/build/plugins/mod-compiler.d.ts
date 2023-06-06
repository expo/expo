import { ExportedConfig, ModPlatform } from '../Plugin.types';
import { ForwardedBaseModOptions } from './createBaseMod';
export type PrebuildSettings = {
    /** Current working directory. Should be one level up from the platform directories. */
    projectRoot: string;
    /** Should compile modifiers in introspection mode (dry run). */
    introspect?: boolean;
    /** Array of platforms to compile */
    platforms?: ModPlatform[];
    /**
     * Throw errors when mods are missing providers.
     * @default true
     */
    assertMissingModProviders?: boolean;
    /** If provided, the providers will reset the input source from this template instead of the existing project root. */
    templateProjectRoot?: string;
};
export declare function withDefaultBaseMods(config: ExportedConfig, props?: ForwardedBaseModOptions): ExportedConfig;
/**
 * Get a prebuild config that safely evaluates mods without persisting any changes to the file system.
 * Currently this only supports infoPlist, entitlements, androidManifest, strings, gradleProperties, and expoPlist mods.
 * This plugin should be evaluated directly:
 */
export declare function withIntrospectionBaseMods(config: ExportedConfig, props?: ForwardedBaseModOptions): ExportedConfig;
/** Compile modifiers in a prebuild config. */
export declare function compileModsAsync(config: ExportedConfig, props: PrebuildSettings): Promise<ExportedConfig>;
/** A generic plugin compiler. */
export declare function evalModsAsync(config: ExportedConfig, { projectRoot, introspect, platforms, assertMissingModProviders, templateProjectRoot, }: PrebuildSettings): Promise<ExportedConfig>;
