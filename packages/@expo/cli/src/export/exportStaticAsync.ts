/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prettyBytes from 'pretty-bytes';
import { inspect } from 'util';

import { getVirtualFaviconAssetsAsync } from './favicon';
import { persistMetroAssetsAsync } from './persistMetroAssets';
import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import { MetroBundlerDevServer } from '../start/server/metro/MetroBundlerDevServer';
import { ExpoRouterServerManifestV1 } from '../start/server/metro/fetchRouterManifest';
import { logMetroErrorAsync } from '../start/server/metro/metroErrorInterface';
import {
  getApiRoutesForDirectory,
  getRouterDirectoryWithManifest,
} from '../start/server/metro/router';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import { learnMore } from '../utils/link';
import { getFreePortAsync } from '../utils/port';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

type Options = {
  outputDir: string;
  minify: boolean;
  exportServer: boolean;
  baseUrl: string;
  includeMaps: boolean;
  entryPoint?: string;
  clear: boolean;
};

/** @private */
export async function unstable_exportStaticAsync(projectRoot: string, options: Options) {
  Log.warn(
    `Experimental static rendering is enabled. ` +
      learnMore('https://docs.expo.dev/router/reference/static-rendering/')
  );

  // Useful for running parallel e2e tests in CI.
  const port = await getFreePortAsync(8082);

  // TODO: Prevent starting the watcher.
  const devServerManager = new DevServerManager(projectRoot, {
    minify: options.minify,
    mode: 'production',
    port,
    location: {},
    resetDevServer: options.clear,
  });
  await devServerManager.startAsync([
    {
      type: 'metro',
      options: {
        port,
        location: {},
        isExporting: true,
        resetDevServer: options.clear,
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
    includeGroupVariations,
  }: {
    manifest: any;
    renderAsync: (pathname: string) => Promise<string>;
    includeGroupVariations?: boolean;
  }
): Promise<Map<string, string>> {
  // name : contents
  const files = new Map<string, string>();

  await Promise.all(
    getHtmlFiles({ manifest, includeGroupVariations }).map(async (outputPath) => {
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
  { outputDir, baseUrl, exportServer, minify, includeMaps }: Options
): Promise<void> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  const appDir = getRouterDirectoryWithManifest(projectRoot, exp);

  const injectFaviconTag = await getVirtualFaviconAssetsAsync(projectRoot, { outputDir, baseUrl });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const [resources, { manifest, serverManifest, renderAsync }] = await Promise.all([
    devServer.getStaticResourcesAsync({ mode: 'production', minify, includeMaps, baseUrl }),
    devServer.getStaticRenderFunctionAsync({
      mode: 'production',
      minify,
      baseUrl,
    }),
  ]);

  debug('Routes:\n', inspect(manifest, { colors: true, depth: null }));

  const files = await getFilesToExportFromServerAsync(projectRoot, {
    manifest,
    // Servers can handle group routes automatically and therefore
    // don't require the build-time generation of every possible group
    // variation.
    includeGroupVariations: !exportServer,
    async renderAsync(pathname: string) {
      const template = await renderAsync(pathname);
      let html = await serializeHtmlWithAssets({
        mode: 'production',
        resources: resources.artifacts,
        template,
        baseUrl,
      });

      if (injectFaviconTag) {
        html = injectFaviconTag(html);
      }

      return html;
    },
  });

  getFilesFromSerialAssets(resources.artifacts, {
    includeMaps,
    files,
  });

  if (resources.assets) {
    await persistMetroAssetsAsync(resources.assets, {
      platform: 'web',
      outputDirectory: outputDir,
      baseUrl,
    });
  }

  if (exportServer) {
    const apiRoutes = await exportApiRoutesAsync({
      outputDir,
      server: devServer,
      appDir,
      manifest: serverManifest,
      baseUrl,
    });

    // Add the api routes to the files to export.
    for (const [route, contents] of apiRoutes) {
      files.set(route, contents);
    }
  } else {
    warnPossibleInvalidExportType(appDir);
  }

  await persistMetroFilesAsync(files, outputDir);
}

// TODO: Move source map modification to the serializer
export function getFilesFromSerialAssets(
  resources: SerialAsset[],
  {
    includeMaps,
    files = new Map<string, string>(),
  }: {
    includeMaps: boolean;
    files?: Map<string, string>;
  }
) {
  resources.forEach((resource) => {
    files.set(
      resource.filename,
      modifyBundlesWithSourceMaps(resource.filename, resource.source, includeMaps)
    );
  });

  return files;
}

export async function persistMetroFilesAsync(files: Map<string, string>, outputDir: string) {
  fs.mkdirSync(path.join(outputDir), { recursive: true });
  if (!files.size) {
    Log.warn('No files to export');
    return;
  }

  Log.log('');

  const plural = files.size === 1 ? '' : 's';
  Log.log(chalk.bold`Exporting ${files.size} file${plural}:`);
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

    // TODO: baseUrl support
    const normalizedFilename = '/' + filename.replace(/^\/+/, '');
    // Ref: https://developer.chrome.com/blog/sourcemaps/#sourceurl-and-displayname-in-action-eval-and-anonymous-functions
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

export function getHtmlFiles({
  manifest,
  includeGroupVariations,
}: {
  manifest: any;
  includeGroupVariations?: boolean;
}): string[] {
  const htmlFiles = new Set<string>();

  function traverseScreens(screens: string | { screens: any; path: string }, baseUrl = '') {
    for (const value of Object.values(screens)) {
      if (typeof value === 'string') {
        let filePath = baseUrl + value;
        if (value === '') {
          filePath =
            baseUrl === ''
              ? 'index'
              : baseUrl.endsWith('/')
              ? baseUrl + 'index'
              : baseUrl.slice(0, -1);
        }
        if (includeGroupVariations) {
          // TODO: Dedupe requests for alias routes.
          addOptionalGroups(filePath);
        } else {
          htmlFiles.add(filePath);
        }
      } else if (typeof value === 'object' && value?.screens) {
        const newPath = baseUrl + value.path + '/';
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
      if (part === '*not-found') {
        return `+not-found`;
      } else if (part.startsWith(':')) {
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
  const variations = new Set<string>();
  const segments = routePath.split('/');

  function generateVariations(segments: string[], current = ''): void {
    if (segments.length === 0) {
      if (current) variations.add(current);
      return;
    }

    const [head, ...rest] = segments;

    if (head.startsWith('(foo,foo')) {
    }

    if (matchGroupName(head)) {
      const groups = head.slice(1, -1).split(',');

      if (groups.length > 1) {
        for (const group of groups) {
          // If there are multiple groups, recurse on each group.
          generateVariations([`(${group.trim()})`, ...rest], current);
        }
        return;
      } else {
        // Start a fork where this group is included
        generateVariations(rest, current ? `${current}/(${groups[0]})` : `(${groups[0]})`);
        // This code will continue and add paths without this group included`
      }
    } else if (current) {
      current = `${current}/${head}`;
    } else {
      current = head;
    }

    generateVariations(rest, current);
  }

  generateVariations(segments);

  return Array.from(variations);
}

async function exportApiRoutesAsync({
  outputDir,
  server,
  appDir,
  baseUrl,
  ...props
}: {
  outputDir: string;
  server: MetroBundlerDevServer;
  appDir: string;
  manifest: ExpoRouterServerManifestV1;
  baseUrl: string;
}): Promise<Map<string, string>> {
  const functionsDir = '_expo/functions';
  const funcDir = path.join(outputDir, functionsDir);
  fs.mkdirSync(path.join(funcDir), { recursive: true });

  const { manifest, files } = await server.exportExpoRouterApiRoutesAsync({
    mode: 'production',
    appDir,
    outputDir: functionsDir,
    prerenderManifest: props.manifest,
    baseUrl,
  });

  Log.log(chalk.bold`Exporting ${files.size} API Routes.`);

  files.set('_expo/routes.json', JSON.stringify(manifest, null, 2));

  return files;
}

function warnPossibleInvalidExportType(appDir: string) {
  const apiRoutes = getApiRoutesForDirectory(appDir);
  if (apiRoutes.length) {
    // TODO: Allow API Routes for native-only.
    Log.warn(
      chalk.yellow`Skipping export for API routes because \`web.output\` is not "server". You may want to remove the routes: ${apiRoutes
        .map((v) => path.relative(appDir, v))
        .join(', ')}`
    );
  }
}
