import '../runtime';
import { ctx } from 'expo-router/_ctx';

import { createPages } from './create-pages';

function fsRouter(loader: (dir: string, file: string) => Promise<any>, pages = 'pages') {
  return createPages(
    async ({ createPage, createLayout, unstable_setBuildData }, { unstable_buildConfig }) => {
      let files: string[];
      if (unstable_buildConfig) {
        // TODO FIXME this is toooooooo naive
        files = (unstable_buildConfig[0]!.customData as any).data;
      } else {
        files = ctx.keys();

        files = files.flatMap((file) => {
          return [file];
        });
      }
      for (const file of files) {
        const mod = await loader(pages, file);

        // NOTE(EvanBacon): Support `getConfig` in routes with top-level "use client"
        const config = 'getConfig' in mod ? await mod.getConfig?.() : {};
        const pathItems = file
          .replace(/^\.\//, '')
          .replace(/\.\w+$/, '')
          .split('/')
          .filter(Boolean);
        const path =
          '/' +
          (['_layout', 'index'].includes(pathItems.at(-1)!)
            ? pathItems.slice(0, -1)
            : pathItems
          ).join('/');
        unstable_setBuildData(path, files); // FIXME toooooo naive, not efficient
        if (pathItems.at(-1) === '_layout') {
          createLayout({
            path,
            // NOTE(EvanBacon): Support routes with top-level "use client"
            component: 'default' in mod ? mod.default : mod,
            render: 'static',
            ...config,
          });
        } else {
          createPage({
            path,
            // NOTE(EvanBacon): Support routes with top-level "use client"
            component: 'default' in mod ? mod.default : mod,
            render: 'dynamic',
            ...config,
          });
        }
      }
    }
  );
}

export default fsRouter(loader);

function loader(dir: string, file: string) {
  return ctx(file);
}
