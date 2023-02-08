/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import assert from 'assert';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

type Options = { outputDir: string; scripts: string[]; minify: boolean };

/** @private */
export async function unstable_exportStaticAsync(projectRoot: string, options: Options) {
  // NOTE(EvanBacon): Please don't use this feature.
  Log.warn('Static exporting with Metro is an experimental feature.');

  const devServerManager = new DevServerManager(projectRoot, {
    minify: options.minify,
    mode: 'production',
    location: {},
  });

  await devServerManager.startAsync([
    {
      type: 'metro',
    },
  ]);

  await exportFromServerAsync(devServerManager, options);

  await devServerManager.stopAsync();
}

async function getExpoRoutesAsync(devServerManager: DevServerManager) {
  const server = devServerManager.getDefaultDevServer();
  assert(server instanceof MetroBundlerDevServer);
  return server.getRoutesAsync();
}

/** Match `(page)` -> `page` */
function matchGroupName(name: string): string | undefined {
  return name.match(/^\(([^/]+?)\)$/)?.[1];
}

async function exportFromServerAsync(
  devServerManager: DevServerManager,
  { outputDir, scripts }: Options
) {
  const devServerUrl = devServerManager.getDefaultDevServer().getDevServerUrl();

  const manifest = await getExpoRoutesAsync(devServerManager);

  debug('Routes:', manifest);
  // name : contents
  const files: { filepath: string; contents: string }[] = [];

  const fetchScreens = (
    screens: Record<string, any>,
    additionPath: string = ''
  ): Promise<any>[] => {
    return Object.entries(screens).map(async ([name, segment]) => {
      const filename = name + '.html';

      if (typeof segment !== 'string') {
        const cleanSegment = matchGroupName(segment.path) ? '' : segment.path;
        return Promise.all(
          fetchScreens(segment.screens, [additionPath, cleanSegment].filter(Boolean).join('/'))
        );
      }

      // TODO: handle dynamic routes
      if (segment !== '*') {
        const cleanSegment = matchGroupName(segment) ? '' : segment;
        const fullSegment = [additionPath, cleanSegment].filter(Boolean).join('/');
        debug('render:', `${devServerUrl}/${fullSegment}`);
        try {
          const screen = await fetch(`${devServerUrl}/${fullSegment}`).then((res) => res.text());
          const contents = screen.replace(
            '</body>',
            scripts.map((script) => `<script src="${script}" defer></script>`).join('') + '</body>'
          );

          files.push({
            filepath: [additionPath, filename].filter(Boolean).join('/'),
            contents,
          });
        } catch (e: any) {
          Log.error('Failed to statically render route:', fullSegment);
          Log.exception(e);
        }
      }
      return null;
    });
  };

  await Promise.all(fetchScreens(manifest.screens));

  fs.mkdirSync(path.join(outputDir), { recursive: true });

  files.forEach((file) => {
    const outputPath = path.join(outputDir, file.filepath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, file.contents);
    Log.log(`Writing:`, file.filepath);
  });
}
