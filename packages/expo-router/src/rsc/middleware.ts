/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This module is bundled with Metro in web/react-server mode and redirects to platform specific renderers.
import type { RenderRscArgs } from '@expo/server/build/middleware/rsc';
import { asyncServerImport } from 'expo-router/_async-server-import';
import path from 'node:path';

import { renderRsc } from './rsc-renderer';

const debug = require('debug')('expo:server:rsc-renderer');

// Tracking the implementation in expo/cli's MetroBundlerDevServer
const rscRenderContext = new Map<string, any>();

function getRscRenderContext(platform: string) {
  // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
  if (rscRenderContext.has(platform)) {
    return rscRenderContext.get(platform)!;
  }

  const context = {};

  rscRenderContext.set(platform, context);
  return context;
}

function interopDefault(mod: any) {
  if ('default' in mod && typeof mod.default === 'object' && mod.default) {
    const def = mod.default;
    if ('default' in def && typeof def.default === 'object' && def.default) {
      return def.default;
    }
    return mod.default;
  }
  return mod;
}

async function getServerActionManifest(
  distFolder: string,
  platform: string
): Promise<
  Record<
    // Input ID
    string,
    [
      // Metro ID
      string,
      // Chunk location.
      string,
    ]
  >
> {
  const filePath = `../../rsc/${platform}/action-manifest.js`;
  // const filePath = path.join(distFolder, `_expo/rsc/${platform}/action-manifest.json`);
  return interopDefault(await asyncServerImport(filePath));
}

async function getSSRManifest(
  distFolder: string,
  platform: string
): Promise<
  Record<
    // Input ID
    string,
    [
      // Metro ID
      string,
      // Chunk location.
      string,
    ]
  >
> {
  const filePath = `../../rsc/${platform}/ssr-manifest.js`;
  // const filePath = path.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
  return interopDefault(await asyncServerImport(filePath));
}

// The import map allows us to use external modules from different bundling contexts.
type ImportMap = {
  router: () => Promise<typeof import('./router/expo-definedRouter')>;
};

export async function renderRscWithImportsAsync(
  distFolder: string,
  imports: ImportMap,
  { body, platform, searchParams, config, method, input, contentType }: RenderRscArgs
): Promise<ReadableStream<any>> {
  if (method === 'POST' && !body) {
    throw new Error('Server request must be provided when method is POST (server actions)');
  }

  const context = getRscRenderContext(platform);

  const entries = await imports.router();

  const ssrManifest = await getSSRManifest(distFolder, platform);
  const actionManifest = await getServerActionManifest(distFolder, platform);
  return renderRsc(
    {
      body: body ?? undefined,
      context,
      config,
      input,
      contentType,
      decodedBody: searchParams.get('x-expo-params'),
    },
    {
      isExporting: true,

      resolveClientEntry(file: string, isServer: boolean) {
        debug('resolveClientEntry', file, { isServer });

        if (isServer) {
          if (!(file in actionManifest)) {
            throw new Error(
              `Could not find file in server action manifest: ${file}. ${JSON.stringify(actionManifest)}`
            );
          }

          const [id, chunk] = actionManifest[file];
          return {
            id,
            chunks: chunk ? [chunk] : [],
          };
        }

        if (!(file in ssrManifest)) {
          throw new Error(`Could not find file in SSR manifest: ${file}`);
        }

        const [id, chunk] = ssrManifest[file];
        return {
          id,
          chunks: chunk ? [chunk] : [],
        };
      },
      async loadServerModuleRsc(file) {
        debug('loadServerModuleRsc', file);
        const filePath = path.join('../../../', file);
        // const filePath = path.join(distFolder, file);
        const m = await asyncServerImport(filePath);

        // TODO: This is a hack to workaround a cloudflare/metro issue where there's an extra `default` wrapper.
        if (typeof caches !== 'undefined') {
          return m.default;
        }
        return m;
      },

      entries: entries!,
    }
  );
}

export async function renderRscAsync(
  distFolder: string,
  args: RenderRscArgs
): Promise<ReadableStream<any>> {
  const platform = args.platform;
  return renderRscWithImportsAsync(
    distFolder,
    {
      router: () => {
        // Assumes this file is saved to: `dist/server/_expo/functions/_flight/[...rsc].js`
        const filePath = `../../rsc/${platform}/router.js`;
        return asyncServerImport(filePath);
      },
    },
    args
  );
}
