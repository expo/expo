import path from 'node:path';

import { RenderRscArgs } from './rsc';

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

function getSSRManifest(distFolder: string, platform: string): Record<string, string> {
  const filePath = path.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
  return $$require_external(filePath);
}

export async function renderRscWithImportsAsync(
  distFolder: string,
  imports: {
    renderer: () => Promise<typeof import('expo-router/src/rsc/rsc-renderer')>;
    router: () => Promise<typeof import('expo-router/src/rsc/router/expo-definedRouter')>;
  },
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
  console.log('SSR Manifest:', ssrManifest);
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
        // Convert file path to a split chunk path.
        console.log('Resolve client entry:', file, ssrManifest[file]);
        return {
          id: file,
          chunks: ssrManifest[file] ? [ssrManifest[file]] : [],
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
        // TODO: Read from a predetermined location in the dist folder.
        const filePath = path.join(distFolder, `_expo/rsc/${platform}/rsc-renderer.js`);
        return require(filePath);
      },
      router: () => {
        const filePath = path.join(distFolder, `_expo/rsc/${platform}/router.js`);
        return require(filePath);
      },
    },
    args
  );
}
