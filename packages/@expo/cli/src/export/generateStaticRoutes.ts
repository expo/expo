import assert from 'assert';
import fs from 'fs';
import { minify } from 'html-minifier';
import fetch from 'node-fetch';
import path from 'path';

import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
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
  { outputDir, scripts }: { outputDir: string; scripts: string[] }
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
      if (!segment.startsWith(':') && segment !== '*') {
        const fullFilename = [additionPath, filename].filter(Boolean).join('/');
        const fullSegment = [additionPath, segment].filter(Boolean).join('/');
        debug('render:', fullFilename, `${devServerUrl}/${fullSegment}`);
        try {
          const screen = await fetch(`${devServerUrl}/${fullSegment}`).then((res) => res.text());
          const content = screen.replace(
            '</body>',
            scripts.map((script) => `<script src="${script}" defer></script>`).join('') + '</body>'
          );

          // TODO: Option to disable minification
          const minifiedHtml = profile(minify, 'minify-html')(content, {
            // collapseWhitespace: true,
            // minifyCSS: true,
            // removeComments: true,
            // removeAttributeQuotes: true,
          });

          files.push([fullFilename, minifiedHtml]);
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

  console.timeEnd('static-generation');
}

export async function exportStaticAsync(
  projectRoot: string,
  options: { outputDir: string; scripts: string[] }
) {
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
