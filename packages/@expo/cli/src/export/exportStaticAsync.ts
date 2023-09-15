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

import { getVirtualFaviconAssetsAsync } from './favicon';
import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { logMetroErrorAsync } from '../start/server/metro/metroErrorInterface';
import { learnMore } from '../utils/link';

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

type Options = { outputDir: string; minify: boolean; basePath: string; includeMaps: boolean };

/** @private */
export async function unstable_exportStaticAsync(projectRoot: string, options: Options) {
  Log.warn(
    `Experimental static rendering is enabled. ` +
      learnMore('https://docs.expo.dev/router/reference/static-rendering/')
  );

  // TODO: Prevent starting the watcher.
  const devServerManager = new DevServerManager(projectRoot, {
    minify: options.minify,
    mode: 'production',
    location: {},
  });
  await devServerManager.startAsync([
    {
      type: 'metro',
      options: {
        location: {},
        isExporting: true,
      },
    },
  ]);

  try {
    await exportFromServerAsync(projectRoot, devServerManager, options);
  } finally {
    await devServerManager.stopAsync();
  }
}

/** Match `(page)` -> `page` */
function matchGroupName(name: string): string | undefined {
  return name.match(/^\(([^/]+?)\)$/)?.[1];
}

export async function getFilesToExportFromServerAsync(
  projectRoot: string,
  {
    manifest,
    renderAsync,
  }: {
    manifest: any;
    renderAsync: (pathname: string) => Promise<string>;
  }
): Promise<Map<string, string>> {
  // name : contents
  const files = new Map<string, string>();

  await Promise.all(
    getHtmlFiles({ manifest }).map(async (outputPath) => {
      const pathname = outputPath.replace(/(?:index)?\.html$/, '');
      try {
        files.set(outputPath, '');
        const data = await renderAsync(pathname);
        files.set(outputPath, data);
      } catch (e: any) {
        await logMetroErrorAsync({ error: e, projectRoot });
        throw new Error('Failed to statically export route: ' + pathname);
      }
    })
  );

  return files;
}

/** Perform all fs commits */
export async function exportFromServerAsync(
  projectRoot: string,
  devServerManager: DevServerManager,
  { outputDir, basePath, minify, includeMaps }: Options
): Promise<void> {
  const injectFaviconTag = await getVirtualFaviconAssetsAsync(projectRoot, {
    basePath,
    outputDir,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const [resources, { manifest, renderAsync }] = await Promise.all([
    devServer.getStaticResourcesAsync({ mode: 'production', minify, includeMaps }),
    devServer.getStaticRenderFunctionAsync({
      mode: 'production',
      minify,
    }),
  ]);

  debug('Routes:\n', inspect(manifest, { colors: true, depth: null }));

  const files = await getFilesToExportFromServerAsync(projectRoot, {
    manifest,
    async renderAsync(pathname: string) {
      const template = await renderAsync(pathname);
      let html = await devServer.composeResourcesWithHtml({
        mode: 'production',
        resources,
        template,
        basePath,
      });

      if (injectFaviconTag) {
        html = injectFaviconTag(html);
      }

      return html;
    },
  });

  resources.forEach((resource) => {
    files.set(
      resource.filename,
      modifyBundlesWithSourceMaps(resource.filename, resource.source, includeMaps)
    );
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

export function modifyBundlesWithSourceMaps(
  filename: string,
  source: string,
  includeMaps: boolean
): string {
  if (filename.endsWith('.js')) {
    // If the bundle ends with source map URLs then update them to point to the correct location.

    // TODO: basePath support
    const normalizedFilename = '/' + filename.replace(/^\/+/, '');
    //# sourceMappingURL=//localhost:8085/index.map?platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static
    //# sourceURL=http://localhost:8085/index.bundle//&platform=web&dev=false&hot=false&lazy=true&minify=true&resolver.environment=client&transform.environment=client&serializer.output=static
    return source.replace(/^\/\/# (sourceMappingURL|sourceURL)=.*$/gm, (...props) => {
      if (includeMaps) {
        if (props[1] === 'sourceURL') {
          return `//# ${props[1]}=` + normalizedFilename;
        } else if (props[1] === 'sourceMappingURL') {
          const mapName = normalizedFilename + '.map';
          return `//# ${props[1]}=` + mapName;
        }
      }
      return '';
    });
  }
  return source;
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
