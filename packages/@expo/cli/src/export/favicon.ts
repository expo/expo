import type { ExpoConfig } from '@expo/config';
import { getConfig } from '@expo/config';
import { generateFaviconAsync, generateImageAsync } from '@expo/image-utils';
import fs from 'node:fs';
import path from 'node:path';

import { Log } from '../log';
import { debugEvent } from './events';
import { getUserDefinedFile } from './publicFolder';
import type { ExportAssetMap } from './saveAssets';

/** @returns the file system path for a user-defined favicon.ico file in the public folder. */
export function getUserDefinedFaviconFile(projectRoot: string): string | null {
  return getUserDefinedFile(projectRoot, ['./favicon.ico']);
}

/**
 * Generate a favicon.ico from `web.favicon` in the Expo config and write it into the asset map
 * (or to disk if no asset map is provided).
 *
 * @returns the public href for the generated favicon, or `null` when a user-supplied
 *   `favicon.ico` already exists in the public folder (browsers resolve it at `/favicon.ico`
 *   automatically) or when no `web.favicon` is configured.
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
