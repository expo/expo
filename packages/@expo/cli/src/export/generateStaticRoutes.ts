/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import assert from 'assert';
import fs from 'fs';
import { minify as minifyHtml } from 'html-minifier';
import fetch from 'node-fetch';
import path from 'path';

import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import { isApiRoute, MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { getMiddlewareContent } from '../start/server/node-renderer';
import { profile } from '../utils/profile';

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

export async function getExpoRoutesAsync(devServerManager: DevServerManager) {
  const server = devServerManager.getDefaultDevServer();

  assert(server instanceof MetroBundlerDevServer);

  return server.getRoutesAsync();
}

export async function exportFromServerAsync(
  projectRoot: string,
  devServerManager: DevServerManager,
  { outputDir, scripts, minify }: Options
) {
  console.time('static-generation');
  const devServerUrl = devServerManager.getDefaultDevServer().getDevServerUrl();

  const manifest = await getExpoRoutesAsync(devServerManager);

  debug('Routes:', manifest);
  // name : contents
  const files: [string, string][] = [];

  const fetchScreens = (
    screens: Record<string, any>,
    additionPath: string = ''
  ): Promise<any>[] => {
    return Object.entries(screens).map(async ([name, segment]) => {
      const filename = name + '.html';

      if (typeof segment !== 'string') {
        return Promise.all(
          fetchScreens(segment.screens, [additionPath, segment.path].filter(Boolean).join('/'))
        );
      }

      // TODO: handle dynamic routes
      if (segment !== '*') {
        const fullSegment = [additionPath, segment].filter(Boolean).join('/');
        debug('render:', `${devServerUrl}/${fullSegment}`);
        try {
          const apiRoutePath = isApiRoute(projectRoot, '/' + fullSegment);
          if (apiRoutePath) {
            const content = await getMiddlewareContent(devServerUrl!, apiRoutePath, {
              minify,
            });

            const outputDir = ['functions', additionPath, name + '.func'].filter(Boolean).join('/');
            const fullFilename = path.join(outputDir, 'index.js');

            files.push([fullFilename, content]);

            files.push([
              path.join(outputDir, '.vc-config.json'),
              JSON.stringify({
                handler: 'index.js',
                runtime: 'nodejs16.x',
                launcherType: 'Nodejs',
                shouldAddHelpers: true,
              }),
            ]);
          } else {
            const screen = await fetch(`${devServerUrl}/${fullSegment}`).then((res) => res.text());
            const content = screen.replace(
              '</body>',
              scripts.map((script) => `<script src="${script}" defer></script>`).join('') +
                '</body>'
            );

            let processedHtml = content;
            if (minify) {
              // TODO: Option to disable minification
              processedHtml = profile(minifyHtml, 'minify-html')(content, {
                // collapseWhitespace: true,
                // minifyCSS: true,
                // removeComments: true,
                // removeAttributeQuotes: true,
              });
            }

            const fullFilename = ['static', additionPath, filename].filter(Boolean).join('/');
            files.push([fullFilename, processedHtml]);
          }
        } catch (e: any) {
          Log.error('Error while generating static HTML for route:', fullSegment);
          Log.exception(e);
        }
      }
    });
  };

  await Promise.all(fetchScreens(manifest.screens));

  fs.mkdirSync(path.join(outputDir), { recursive: true });

  files.forEach(([filename, contents]) => {
    const outputPath = path.join(outputDir, filename);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, contents);

    Log.log(`Writing:`, filename);
  });

  fs.writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify({ version: 3 }));

  console.timeEnd('static-generation');
}

export async function exportStaticAsync(projectRoot: string, options: Options) {
  const devServerManager = new DevServerManager(projectRoot, {
    minify: true,
    mode: 'production',
    location: {},
  });

  await devServerManager.startAsync([
    {
      type: 'metro',
    },
  ]);

  await exportFromServerAsync(projectRoot, devServerManager, options);

  await devServerManager.stopAsync();
}

type Options = { outputDir: string; scripts: string[]; minify: boolean };
