import path from 'node:path';

import type { RenderRscArgs } from './rsc';

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
  renderer: () => Promise<typeof import('expo-router/src/rsc/rsc-renderer')>;
  router: () => Promise<typeof import('expo-router/src/rsc/router/expo-definedRouter')>;
};

export async function renderRscWithImportsAsync(
  distFolder: string,
  imports: ImportMap,
  { body, platform, searchParams, config, method, input, contentType }: RenderRscArgs
): Promise<ReadableStream<any>> {
  if (method === 'POST') {
    if (!body)
      throw new Error('Server request must be provided when method is POST (server actions)');
  }

  const { renderRsc } = await imports.renderer();

  const context = getRscRenderContext(platform);

  const entries = await imports.router();
  if (method === 'POST') {
    // HACK: This is some mock function to load the JS in to memory which in turn ensures the server actions are registered.
    entries.default.getBuildConfig!(async (input) => []);
  }

  const ssrManifest = getSSRManifest(distFolder, platform);

  return renderRsc(
    {
      body: body ?? undefined,
      searchParams,
      context,
      config,
      method,
      input,
      contentType,
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
      renderer: () => {
        const filePath = path.join(distFolder, `_expo/rsc/${platform}/rsc-renderer.js`);
        // @ts-expect-error: Special syntax for expo/metro to access `require`
        return $$require_external(filePath);
      },
      router: () => {
        const filePath = path.join(distFolder, `_expo/rsc/${platform}/router.js`);
        // @ts-expect-error: Special syntax for expo/metro to access `require`
        return $$require_external(filePath);
      },
    },
    args
  );
}
