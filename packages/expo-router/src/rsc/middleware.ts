/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This module is bundled with Metro in web/react-server mode and redirects to platform specific renderers.
import type { RenderRscArgs } from '@expo/server/build/middleware/rsc';
import path from 'node:path';

import { renderRsc } from './rsc-renderer';

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

function getSSRManifest(
  distFolder: string,
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
  const filePath = path.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
  // @ts-expect-error: Special syntax for expo/metro to access `require`
  return $$require_external(filePath);
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

  const ssrManifest = getSSRManifest(distFolder, platform);

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
      resolveClientEntry(file: string) {
        const [id, chunk] = ssrManifest[file];
        return {
          id,
          chunks: chunk ? [chunk] : [],
        };
      },
      entries: entries!,
      loadServerModuleRsc: async (url) => {
        // TODO: SSR load action code from on disk file.
        throw new Error('React server actions are not implemented yet');
      },
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
        const filePath = path.join(distFolder, `_expo/rsc/${platform}/router.js`);
        // @ts-expect-error: Special syntax for expo/metro to access `require`
        return $$require_external(filePath);
      },
    },
    args
  );
}
