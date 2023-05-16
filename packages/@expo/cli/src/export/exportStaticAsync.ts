/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
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

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

type Options = { outputDir: string; minify: boolean };

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

/** Match `(page)` -> `page` */
function matchGroupName(name: string): string | undefined {
  return name.match(/^\(([^/]+?)\)$/)?.[1];
}

export async function getFilesToExportFromServerAsync({
  manifest,
  renderAsync,
}: {
  manifest: any;
  renderAsync: (pathname: string) => Promise<string>;
}): Promise<Map<string, string>> {
  // name : contents
  const files = new Map<string, string>();

  await Promise.all(
    getHtmlFiles({ manifest }).map(async (outputPath) => {
      const pathname = outputPath.replace(/(index)?\.html$/, '');
      try {
        files.set(outputPath, '');
        const data = await renderAsync(pathname);
        files.set(outputPath, data);
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

/** Perform all fs commits */
export async function exportFromServerAsync(
  devServerManager: DevServerManager,
  { outputDir }: Options
): Promise<void> {
  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const [manifest, resources, renderAsync] = await Promise.all([
    devServer.getRoutesAsync(),
    devServer.getStaticResourcesAsync({ mode: 'production' }),
    devServer.getStaticRenderFunctionAsync({
      mode: 'production',
    }),
  ]);

  debug('Routes:\n', inspect(manifest, { colors: true, depth: null }));

  const files = await getFilesToExportFromServerAsync({
    manifest,
    async renderAsync(pathname: string) {
      const template = await renderAsync(pathname);
      return devServer.composeResourcesWithHtml({
        mode: 'production',
        resources,
        template,
      });
    },
  });

  resources.forEach((resource) => {
    files.set(resource.filename, resource.source);
  });

  fs.mkdirSync(path.join(outputDir), { recursive: true });

  Log.log('');
  Log.log(chalk.bold`Exporting ${files.size} files:`);
  await Promise.all(
    [...files.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(async ([file, contents]) => {
        const length = Buffer.byteLength(contents, 'utf8');
        Log.log(file, chalk.gray`(${prettyBytes(length)})`);
        const outputPath = path.join(outputDir, file);
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.writeFile(outputPath, contents);
      })
  );
  Log.log('');
}

export function getHtmlFiles({ manifest }: { manifest: any }): string[] {
  const htmlFiles = new Set<string>();

  function traverseScreens(screens: string | { screens: any; path: string }, basePath = '') {
    for (const value of Object.values(screens)) {
      if (typeof value === 'string') {
        let filePath = basePath + value;
        if (value === '') {
          filePath =
            basePath === ''
              ? 'index'
              : basePath.endsWith('/')
              ? basePath + 'index'
              : basePath.slice(0, -1);
        }
        // TODO: Dedupe requests for alias routes.
        addOptionalGroups(filePath);
      } else if (typeof value === 'object' && value?.screens) {
        const newPath = basePath + value.path + '/';
        traverseScreens(value.screens, newPath);
      }
    }
  }

  function addOptionalGroups(path: string) {
    const variations = getPathVariations(path);
    for (const variation of variations) {
      htmlFiles.add(variation);
    }
  }

  traverseScreens(manifest.screens);

  return Array.from(htmlFiles).map((value) => {
    const parts = value.split('/');
    // Replace `:foo` with `[foo]` and `*foo` with `[...foo]`
    const partsWithGroups = parts.map((part) => {
      if (part.startsWith(':')) {
        return `[${part.slice(1)}]`;
      } else if (part.startsWith('*')) {
        return `[...${part.slice(1)}]`;
      }
      return part;
    });
    return partsWithGroups.join('/') + '.html';
  });
}

// Given a route like `(foo)/bar/(baz)`, return all possible variations of the route.
// e.g. `(foo)/bar/(baz)`, `(foo)/bar/baz`, `foo/bar/(baz)`, `foo/bar/baz`,
export function getPathVariations(routePath: string): string[] {
  const variations = new Set<string>([routePath]);
  const segments = routePath.split('/');

  function generateVariations(segments: string[], index: number): void {
    if (index >= segments.length) {
      return;
    }

    const newSegments = [...segments];
    while (
      index < newSegments.length &&
      matchGroupName(newSegments[index]) &&
      newSegments.length > 1
    ) {
      newSegments.splice(index, 1);
      variations.add(newSegments.join('/'));
      generateVariations(newSegments, index + 1);
    }

    generateVariations(segments, index + 1);
  }

  generateVariations(segments, 0);

  return Array.from(variations);
}
