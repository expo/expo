import type { AssetData } from '@expo/metro/metro';
type FontObject = {
    fontFamily: string;
    fontDefinitions: {
        path: string;
        weight: number;
        style?: 'normal' | 'italic' | undefined;
    }[];
};
type Font = string | FontObject;
type FontProps = {
    fonts?: string[];
    android?: {
        fonts?: Font[];
    };
    ios?: {
        fonts?: string[];
    };
};
/**
 * Extracts the expo-font plugin props from the `exp.plugins` array.
 */
export declare function getExpoFontPluginProps(plugins: any[] | undefined): FontProps | null;
/**
 * Synchronous version of `resolveFontPaths` from expo-font/plugin/src/utils.ts.
 * Duplicated here to avoid a dependency on expo-font and to use sync fs.
 * If the original changes, this should be updated to match.
 */
export declare function resolveFontPathsSync(fonts: string[], projectRoot: string): string[];
/**
 * Returns a Set of basenames (e.g. "MaterialIcons.ttf") for fonts that are
 * natively embedded via the expo-font config plugin.
 */
export declare function getEmbeddedFontBasenames(projectRoot: string, platform: string, plugins: any[] | undefined): Set<string>;
/**
 * Filters natively-embedded font assets from Metro's asset output list.
 *
 * When expo-font's config plugin embeds fonts natively, Metro also copies
 * those same font files as assets (from require('./font.ttf')). Since the
 * runtime already handles this (expo-font/src/memory.ts isLoadedNative() → true),
 * the Metro-bundled font file is never used. This function removes the duplicates.
 *
 * The JS bundle (containing registerAsset() calls) is NOT affected — only
 * the physical font files are excluded from the asset copy.
 *
 * On any error, returns the original unfiltered assets (optimization, not correctness).
 */
export declare function filterEmbeddedFontsFromAssets(assets: AssetData[], projectRoot: string, platform: string | null | undefined): AssetData[];
export {};
