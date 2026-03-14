/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import type { AssetData } from '@expo/metro/metro';
import fs from 'fs';
import path from 'path';

const debug = require('debug')('expo:metro:config:filterEmbeddedFontAssets');

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

const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);

/**
 * Extracts the expo-font plugin props from the `exp.plugins` array.
 */
export function getExpoFontPluginProps(plugins: any[] | undefined): FontProps | null {
  if (!Array.isArray(plugins)) {
    return null;
  }

  for (const plugin of plugins) {
    if (plugin === 'expo-font') {
      // Plugin without props — no fonts configured
      return null;
    }

    if (Array.isArray(plugin) && plugin[0] === 'expo-font') {
      const props = plugin[1];
      if (props && typeof props === 'object') {
        return props as FontProps;
      }
      return null;
    }
  }

  return null;
}

/**
 * Synchronous version of `resolveFontPaths` from expo-font/plugin/src/utils.ts.
 * Duplicated here to avoid a dependency on expo-font and to use sync fs.
 * If the original changes, this should be updated to match.
 */
export function resolveFontPathsSync(fonts: string[], projectRoot: string): string[] {
  const results: string[] = [];

  for (const fontPath of fonts) {
    try {
      const resolvedPath = path.resolve(projectRoot, fontPath);
      const stat = fs.statSync(resolvedPath);

      if (stat.isDirectory()) {
        const entries = fs.readdirSync(resolvedPath);
        for (const entry of entries) {
          const fullPath = path.join(resolvedPath, entry);
          if (FONT_EXTENSIONS.has(path.extname(fullPath).toLowerCase())) {
            results.push(fullPath);
          }
        }
      } else if (FONT_EXTENSIONS.has(path.extname(resolvedPath).toLowerCase())) {
        results.push(resolvedPath);
      }
    } catch {
      // Silently skip unresolvable paths
      debug('Skipping unresolvable font path:', fontPath);
    }
  }

  return results;
}

/**
 * Collects font file paths from the plugin props for a given platform,
 * extracting paths from FontObject entries on Android.
 */
function collectFontPaths(props: FontProps, platform: string): string[] {
  const paths: string[] = [...(props.fonts ?? [])];

  if (platform === 'ios') {
    paths.push(...(props.ios?.fonts ?? []));
  } else if (platform === 'android') {
    const androidFonts = props.android?.fonts ?? [];
    for (const font of androidFonts) {
      if (typeof font === 'string') {
        paths.push(font);
      } else if (font && typeof font === 'object' && Array.isArray(font.fontDefinitions)) {
        for (const def of font.fontDefinitions) {
          if (def.path) {
            paths.push(def.path);
          }
        }
      }
    }
  }

  return paths;
}

/**
 * Returns a Set of basenames (e.g. "MaterialIcons.ttf") for fonts that are
 * natively embedded via the expo-font config plugin.
 */
export function getEmbeddedFontBasenames(
  projectRoot: string,
  platform: string,
  plugins: any[] | undefined
): Set<string> {
  const props = getExpoFontPluginProps(plugins);
  if (!props) {
    return new Set();
  }

  const fontPaths = collectFontPaths(props, platform);
  if (fontPaths.length === 0) {
    return new Set();
  }

  const resolvedPaths = resolveFontPathsSync(fontPaths, projectRoot);
  return new Set(resolvedPaths.map((p) => path.basename(p)));
}

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
export function filterEmbeddedFontsFromAssets(
  assets: AssetData[],
  projectRoot: string,
  platform: string | null | undefined
): AssetData[] {
  // Web serves fonts as network assets — no native embedding
  if (!platform || platform === 'web') {
    return assets;
  }

  try {
    const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
    const embeddedBasenames = getEmbeddedFontBasenames(projectRoot, platform, exp.plugins);

    if (embeddedBasenames.size === 0) {
      return assets;
    }

    debug('Embedded font basenames:', [...embeddedBasenames]);

    const filtered = assets.filter((asset) => {
      const basename = `${asset.name}.${asset.type}`;
      if (embeddedBasenames.has(basename)) {
        debug('Filtering embedded font asset:', basename);
        return false;
      }
      return true;
    });

    const removedCount = assets.length - filtered.length;
    if (removedCount > 0) {
      debug(`Filtered ${removedCount} natively-embedded font asset(s) from Metro output`);
    }

    return filtered;
  } catch (error) {
    debug('Failed to filter embedded font assets, returning unfiltered:', error);
    return assets;
  }
}
