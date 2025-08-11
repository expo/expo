/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This module is bundled with Metro in web/react-server mode and redirects to platform specific renderers.
import type { RenderRscArgs } from '@expo/server/private';
import Constants from 'expo-constants';
import path from 'node:path';

import { renderRsc } from './rsc-renderer';

declare const $$require_external: typeof require;

const debug = require('debug')('expo:server:rsc-renderer');

// Tracking the implementation in expo/cli's MetroBundlerDevServer
const rscRenderContext = new Map<string, any>();

function serverRequire<T = any>(...targetOutputModulePath: string[]): T {
  // NOTE(@kitten): This `__dirname` will be located in the output file system, e.g. `dist/server/*`
  const filePath = path.join(__dirname, ...targetOutputModulePath);
  return $$require_external(filePath);
}

function getRscRenderContext(platform: string) {
  // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
  if (rscRenderContext.has(platform)) {
    return rscRenderContext.get(platform)!;
  }

  const context = {};

  rscRenderContext.set(platform, context);
  return context;
}

function getServerActionManifest(
  _distFolder: string,
  platform: string
): Record<
  // Input ID
  string,
  [
    // Metro ID
    string,
    // Chunk location.
    string,
  ]
> {
  const filePath = `../../rsc/${platform}/action-manifest.js`;
  return serverRequire(filePath);
}

function getSSRManifest(
  _distFolder: string,
  platform: string
): Record<
  // Input ID
  string,
  [
    // Metro ID
    string,
    // Chunk location.
    string,
  ]
> {
  const filePath = `../../rsc/${platform}/ssr-manifest.js`;
  return serverRequire(filePath);
}

// The import map allows us to use external modules from different bundling contexts.
type ImportMap = {
  router: () => Promise<typeof import('./router/expo-definedRouter')>;
};

export async function renderRscWithImportsAsync(
  distFolder: string,
  imports: ImportMap,
  { body, platform, searchParams, config, method, input, contentType, headers }: RenderRscArgs
): Promise<ReadableStream<any>> {
  globalThis.__expo_platform_header = platform;
  if (method === 'POST' && !body) {
    throw new Error('Server request must be provided when method is POST (server actions)');
  }

  const context = getRscRenderContext(platform);
  context['__expo_requestHeaders'] = headers;

  const router = await imports.router();
  const entries = router.default({
    redirects: Constants.expoConfig?.extra?.router?.redirects,
    rewrites: Constants.expoConfig?.extra?.router?.rewrites,
  });

  const ssrManifest = getSSRManifest(distFolder, platform);
  const actionManifest = getServerActionManifest(distFolder, platform);
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
        // NOTE(@kitten): [WORKAROUND] Assumes __dirname is at `dist/server/_expo/functions/_flight`
        return serverRequire('../../../', file);
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
        // NOTE(@kitten): [WORKAROUND] Assumes __dirname is at `dist/server/_expo/functions/_flight`
        return serverRequire(`../../rsc/${platform}/router.js`);
      },
    },
    args
  );
}
