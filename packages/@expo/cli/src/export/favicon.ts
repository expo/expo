import type { ExpoConfig } from '@expo/config';
import { getConfig } from '@expo/config';
import { generateFaviconAsync, generateImageAsync } from '@expo/image-utils';
import fs from 'node:fs';
import path from 'node:path';

import { Log } from '../log';
import { debugEvent } from './events';
import { getUserDefinedFile } from './publicFolder';
import type { ExportAssetMap } from './saveAssets';

/** @returns whether the given path looks like an SVG (by file extension). */
function isSvgPath(p: string): boolean {
  return path.extname(p).toLowerCase() === '.svg';
}

/** @returns the file system path for a user-defined favicon file in the public folder. */
export function getUserDefinedFaviconFile(projectRoot: string): string | null {
  // SVG first: when a user drops both files, they almost certainly want the
  // SVG to win in modern browsers. Older browsers ignore the SVG `<link>` and
  // auto-discover `/favicon.ico`, so the ICO still functions as a fallback.
  return getUserDefinedFile(projectRoot, ['./favicon.svg', './favicon.ico']);
}

/**
 * Generate a favicon from `web.favicon` in the Expo config and write it into the asset map
 * (or to disk if no asset map is provided). Accepts either a raster image (rasterized to a
 * multi-size `favicon.ico`) or an SVG (copied byte-for-byte to `favicon.svg`, preserving
 * features like `prefers-color-scheme` media queries inside the SVG).
 *
 * @returns the public href for the generated favicon (`.ico` or `.svg`), or `null` when a
 *   user-supplied `favicon.ico` already exists in the public folder (browsers resolve it at
 *   `/favicon.ico` automatically), or when no `web.favicon` is configured.
 */
export async function generateFaviconAssetAsync(
  projectRoot: string,
  {
    baseUrl,
    outputDir,
    files,
    exp,
  }: { outputDir: string; baseUrl: string; files?: ExportAssetMap; exp?: ExpoConfig }
): Promise<{ href: string } | null> {
  const existing = getUserDefinedFaviconFile(projectRoot);
  if (existing) {
    if (isSvgPath(existing)) {
      // A user-supplied `public/favicon.svg` is copied to the output by
      // `copyPublicFolderAsync`; we still need to inject the `<link>` tag,
      // because browsers don't auto-discover SVG favicons the way they do
      // `/favicon.ico`.
      return { href: `${baseUrl}/favicon.svg` };
    }
    return null;
  }

  const data = await getFaviconFromExpoConfigAsync(projectRoot, {
    exp,
  });

  if (!data) {
    return null;
  }

  const assetPath = path.join(outputDir, data.path);
  if (files) {
    debugEvent('favicon:storing_asset', { assetPath });
    files.set(data.path, {
      contents: data.source,
      targetDomain: 'client',
    });
  } else {
    debugEvent('favicon:writing_asset', { assetPath });
    await fs.promises.writeFile(assetPath, data.source);
  }

  return { href: `${baseUrl}/${data.path}` };
}

export async function getFaviconFromExpoConfigAsync(
  projectRoot: string,
  { force = false, exp = getConfig(projectRoot).exp }: { force?: boolean; exp?: ExpoConfig } = {}
) {
  const src = exp.web?.favicon ?? null;
  if (!src) {
    return null;
  }

  // SVG: copy the file raw. Rasterizing it would defeat the point of an SVG
  // favicon — features like `prefers-color-scheme` media queries inside the
  // SVG need the original markup to survive into the served asset. It would
  // also crash the export today, since `@expo/image-utils` rejects SVG in
  // `ensureImageOptionsAsync` (unsupported MIME) and this function's
  // `try/catch` only handles `ENOENT`.
  if (isSvgPath(src)) {
    try {
      const absSrc = path.resolve(projectRoot, src);
      const source = await fs.promises.readFile(absSrc);
      return { source, path: 'favicon.svg' };
    } catch (error: any) {
      if (!force && error.code === 'ENOENT') {
        Log.warn(`Favicon source file in Expo config (web.favicon) does not exist: ${src}`);
        return null;
      }
      throw error;
    }
  }

  const dims = [16, 32, 48];
  const cacheType = 'favicon';

  const size = dims[dims.length - 1]!;
  try {
    const { source } = await generateImageAsync(
      { projectRoot, cacheType },
      {
        resizeMode: 'contain',
        src,
        backgroundColor: 'transparent',
        width: size,
        height: size,
        name: `favicon-${size}.png`,
      }
    );

    const faviconBuffer = await generateFaviconAsync(source, dims);

    return { source: faviconBuffer, path: 'favicon.ico' };
  } catch (error: any) {
    // Check for ENOENT
    if (!force && error.code === 'ENOENT') {
      Log.warn(`Favicon source file in Expo config (web.favicon) does not exist: ${src}`);
      return null;
    }
    throw error;
  }
}
