import { getConfig } from '@expo/config';
import { generateFaviconAsync, generateImageAsync } from '@expo/image-utils';
import fs from 'fs';
import path from 'path';

import { getUserDefinedFile } from './publicFolder';
import { ExportAssetMap } from './saveAssets';
import { Log } from '../log';

const debug = require('debug')('expo:favicon') as typeof console.log;

/** @returns the file system path for a user-defined favicon.ico file in the public folder. */
export function getUserDefinedFaviconFile(projectRoot: string): string | null {
  return getUserDefinedFile(projectRoot, ['./favicon.ico']);
}

export async function getVirtualFaviconAssetsAsync(
  projectRoot: string,
  { baseUrl, outputDir, files }: { outputDir: string; baseUrl: string; files?: ExportAssetMap }
): Promise<((html: string) => string) | null> {
  const existing = getUserDefinedFaviconFile(projectRoot);
  if (existing) {
    debug('Using user-defined favicon.ico file.');
    return null;
  }

  const data = await getFaviconFromExpoConfigAsync(projectRoot);

  if (!data) {
    return null;
  }

  await Promise.all(
    [data].map(async (asset) => {
      const assetPath = path.join(outputDir, asset.path);
      if (files) {
        debug('Storing asset for persisting: ' + assetPath);
        files?.set(asset.path, {
          contents: asset.source,
          targetDomain: 'client',
        });
      } else {
        debug('Writing asset to disk: ' + assetPath);
        await fs.promises.writeFile(assetPath, asset.source);
      }
    })
  );

  function injectFaviconTag(html: string): string {
    if (!html.includes('</head>')) {
      return html;
    }
    return html.replace(
      '</head>',
      `<link rel="shortcut icon" href="${baseUrl}/favicon.ico" /></head>`
    );
  }

  return injectFaviconTag;
}

export async function getFaviconFromExpoConfigAsync(
  projectRoot: string,
  { force = false }: { force?: boolean } = {}
) {
  const { exp } = getConfig(projectRoot);

  const src = exp.web?.favicon ?? null;
  if (!src) {
    return null;
  }

  const dims = [16, 32, 48];
  const cacheType = 'favicon';

  const size = dims[dims.length - 1];
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
