import type { ExpoConfig } from '@expo/config';
import { getConfig } from '@expo/config';
import { generateFaviconAsync, generateImageAsync } from '@expo/image-utils';
import fs from 'node:fs';
import path from 'node:path';

import { Log } from '../log';
import { debugEvent } from './events';
import { getUserDefinedFile } from './publicFolder';
import type { ExportAssetMap } from './saveAssets';

/**
 * @returns whether the given path looks like an SVG (by file extension).
 *
 * Works for both filesystem paths and query-stripped URL pathnames, so the export pipeline
 * and the dev-server middleware classify a favicon the same way.
 */
export function isSvgPath(p: string): boolean {
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
 * A favicon in the public folder wins the `<link>`, matching the pre-existing behavior for
 * `public/favicon.ico`. A `public/favicon.svg` does *not* suppress `favicon.ico` generation,
 * though: a raster `web.favicon` is still rasterized so that browsers without SVG favicon
 * support keep auto-discovering `/favicon.ico`. (An SVG `web.favicon` is skipped in that case,
 * since it would write to the same `favicon.svg` path the public file already occupies.)
 *
 * @returns the public href for the favicon to link (`.ico` or `.svg`), or `null` when a
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
  if (existing && !isSvgPath(existing)) {
    return null;
  }

  // A user-supplied `public/favicon.svg` is copied to the output by `copyPublicFolderAsync`,
  // but still needs a `<link>` tag: browsers don't auto-discover SVG favicons the way they do
  // `/favicon.ico`.
  const publicSvgHref = existing ? `${baseUrl}/favicon.svg` : null;

  const data = await getFaviconFromExpoConfigAsync(projectRoot, {
    exp,
  });

  // Generate the configured favicon even when a public SVG takes the `<link>`, so that a
  // raster `web.favicon` keeps producing the `/favicon.ico` older browsers auto-discover.
  // Skip it only when it would collide with the public file's own output path.
  const isCollidingWithPublicSvg = !!publicSvgHref && !!data && isSvgPath(data.path);

  if (data && !isCollidingWithPublicSvg) {
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
  }

  if (publicSvgHref) {
    return { href: publicSvgHref };
  }

  if (!data) {
    return null;
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
