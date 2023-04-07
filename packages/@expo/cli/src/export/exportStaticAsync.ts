/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ExpoConfig, getConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prettyBytes from 'pretty-bytes';
import { inspect } from 'util';

import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { stripAnsi } from '../utils/ansi';
import { appendLinkToHtml, appendScriptsToHtml } from './html';

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

type Options = {
  outputDir: string;
  scripts: string[];
  cssLinks: string[];
  minify: boolean;
  features: ExportFeature[];
};

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

  await exportFromServerAsync(projectRoot, devServerManager, options);

  await devServerManager.stopAsync();
}

export type ExportFeature = 'html' | 'handlers';

/** Perform all fs commits */
export async function exportFromServerAsync(
  projectRoot: string,
  devServerManager: DevServerManager,
  { outputDir, scripts, features, cssLinks }: Options
): Promise<void> {
  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  // Decouple html from handlers to enable API routes in native-only projects.
  await Promise.all([
    (() => {
      if (features.includes('html')) {
        return exportStaticHtmlFilesAsync(outputDir, scripts, cssLinks, devServer);
      }
    })(),
    (() => {
      if (features.includes('handlers')) {
        return exportRouteHandlersAsync(outputDir, devServer);
      }
    })(),
  ]);
}

export async function getHtmlFilesToExportFromServerAsync({
  requests,
  scripts,
  cssLinks,
  renderAsync,
}: {
  requests: string[];
  scripts: string[];
  cssLinks: string[];
  renderAsync: (pathname: string) => Promise<{
    fetchData: boolean;
    scriptContents: string;
    renderAsync: () => any;
  }>;
}): Promise<Map<string, string>> {
  // name : contents
  const files = new Map<string, string>();

  await Promise.all(
    requests.map(async (pathname) => {
      try {
        const data = await renderAsync(pathname);
        files.set(
          pathname + '.html',
          appendLinkToHtml(
            appendScriptsToHtml(data.renderAsync(), scripts),
            cssLinks
              .map((href) => [
                {
                  as: 'style',
                  rel: 'preload',
                  href,
                },
                {
                  rel: 'stylesheet',
                  href,
                },
              ])
              .flat()
          )
        );
      } catch (e: any) {
        // TODO: Format Metro error message better...
        Log.error('Failed to statically render route:', pathname);
        e.message = stripAnsi(e.message);
        Log.exception(e);
        throw e;
      }
    })
  );

  return files;
}

async function exportStaticHtmlFilesAsync(
  outputDir: string,
  scripts: string[],
  cssLinks: string[],
  server: MetroBundlerDevServer
) {
  const staticDir = path.join(outputDir);
  fs.mkdirSync(path.join(staticDir), { recursive: true });

  const manifest = await server.getRoutesAsync();
  console.log('Routes:\n', inspect(manifest, { colors: true, depth: null }));
  const files = await getHtmlFilesToExportFromServerAsync({
    requests: manifest.staticHtmlPaths,
    scripts,
    cssLinks,
    renderAsync(pathname: string) {
      return server.getStaticPageAsync(pathname, { mode: 'production' });
    },
  });

  Log.log(chalk.bold`Exporting ${files.size} HTML files:`);
  await writeFilesAsync(staticDir, [...files.entries()]);
}

async function exportRouteHandlersAsync(outputDir: string, server: MetroBundlerDevServer) {
  const funcDir = path.join(outputDir, '_expo/functions');
  fs.mkdirSync(path.join(funcDir), { recursive: true });

  const [routesManifest, middleware] = await server.getFunctionsAsync({ mode: 'production' });

  await fs.promises.writeFile(
    path.join(outputDir, '_expo/routes.json'),
    JSON.stringify(routesManifest, null, 2),
    'utf-8'
  );

  const files = Object.entries(middleware) as [string, string][];
  Log.log(chalk.bold`Exporting ${files.length} Route Handlers:`);
  await writeFilesAsync(funcDir, files);
}

async function writeFilesAsync(rootDirectory: string, files: [string, string][]) {
  let report: { file: string; length: number }[] = [];
  await Promise.all(
    files
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([file, contents]) => {
        const length = Buffer.byteLength(contents, 'utf8');
        report.push({ file, length });
        const outputPath = path.join(rootDirectory, file);
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.writeFile(outputPath.replace(/\.[tj]sx?$/, '.js'), contents);
      })
  );

  for (const { file, length } of report) {
    Log.log(file, chalk.gray`(${prettyBytes(length)})`);
  }
}
