/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import assert from 'assert';
import chalk from 'chalk';
import { RouteNode } from 'expo-router/build/Route';
import { stripGroupSegmentsFromPath } from 'expo-router/build/matchers';
import path from 'path';
import resolveFrom from 'resolve-from';
import { inspect } from 'util';

import { getVirtualFaviconAssetsAsync } from './favicon';
import { persistMetroAssetsAsync } from './persistMetroAssets';
import { ExportAssetMap, getFilesFromSerialAssets } from './saveAssets';
import { Log } from '../log';
import { DevServerManager } from '../start/server/DevServerManager';
import {
  ExpoRouterRuntimeManifest,
  MetroBundlerDevServer,
} from '../start/server/metro/MetroBundlerDevServer';
import { ExpoRouterServerManifestV1 } from '../start/server/metro/fetchRouterManifest';
import { logMetroErrorAsync } from '../start/server/metro/metroErrorInterface';
import { getApiRoutesForDirectory } from '../start/server/metro/router';
import { serializeHtmlWithAssets } from '../start/server/metro/serializeHtml';
import { learnMore } from '../utils/link';
import { getFreePortAsync } from '../utils/port';

const debug = require('debug')('expo:export:generateStaticRoutes') as typeof console.log;

type Options = {
  mode: 'production' | 'development';
  files?: ExportAssetMap;
  outputDir: string;
  minify: boolean;
  exportServer: boolean;
  baseUrl: string;
  includeSourceMaps: boolean;
  entryPoint?: string;
  clear: boolean;
  routerRoot: string;
  maxWorkers?: number;
  isExporting: boolean;
};

type HtmlRequestLocation = {
  /** The output file path name to use relative to the static folder. */
  filePath: string;
  /** The pathname to make requests to in order to fetch the HTML. */
  pathname: string;
  /** The runtime route node object, used to associate async modules with the static HTML. */
  route: RouteNode;
};

/** @private */
export async function unstable_exportStaticAsync(projectRoot: string, options: Options) {
  Log.log(
    `Static rendering is enabled. ` +
      learnMore('https://docs.expo.dev/router/reference/static-rendering/')
  );

  // Useful for running parallel e2e tests in CI.
  const port = await getFreePortAsync(8082);

  // TODO: Prevent starting the watcher.
  const devServerManager = new DevServerManager(projectRoot, {
    minify: options.minify,
    mode: options.mode,
    port,
    isExporting: true,
    location: {},
    resetDevServer: options.clear,
    maxWorkers: options.maxWorkers,
  });

  await devServerManager.startAsync([
    {
      type: 'metro',
      options: {
        port,
        mode: options.mode,
        location: {},
        isExporting: true,
        minify: options.minify,
        resetDevServer: options.clear,
        maxWorkers: options.maxWorkers,
      },
    },
  ]);

  try {
    return await exportFromServerAsync(projectRoot, devServerManager, options);
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
    // Servers can handle group routes automatically and therefore
    // don't require the build-time generation of every possible group
    // variation.
    exportServer,
    // name : contents
    files = new Map(),
  }: {
    manifest: ExpoRouterRuntimeManifest;
    renderAsync: (requestLocation: HtmlRequestLocation) => Promise<string>;
    exportServer?: boolean;
    files?: ExportAssetMap;
  }
): Promise<ExportAssetMap> {
  await Promise.all(
    getHtmlFiles({ manifest, includeGroupVariations: !exportServer }).map(
      async ({ route, filePath, pathname }) => {
        try {
          const targetDomain = exportServer ? 'server' : 'client';
          files.set(filePath, { contents: '', targetDomain });
          const data = await renderAsync({ route, filePath, pathname });
          files.set(filePath, {
            contents: data,
            routeId: pathname,
            targetDomain,
          });
        } catch (e: any) {
          await logMetroErrorAsync({ error: e, projectRoot });
          throw new Error('Failed to statically export route: ' + pathname);
        }
      }
    )
  );

  return files;
}

function modifyRouteNodeInRuntimeManifest(
  manifest: ExpoRouterRuntimeManifest,
  callback: (route: RouteNode) => any
) {
  const iterateScreens = (screens: ExpoRouterRuntimeManifest['screens']) => {
    Object.values(screens).map((value) => {
      if (typeof value !== 'string') {
        if (value._route) callback(value._route);
        iterateScreens(value.screens);
      }
    });
  };

  iterateScreens(manifest.screens);
}

// TODO: Do this earlier in the process.
function makeRuntimeEntryPointsAbsolute(manifest: ExpoRouterRuntimeManifest, appDir: string) {
  modifyRouteNodeInRuntimeManifest(manifest, (route) => {
    if (Array.isArray(route.entryPoints)) {
      route.entryPoints = route.entryPoints.map((entryPoint) => {
        if (entryPoint.startsWith('.')) {
          return path.resolve(appDir, entryPoint);
        } else if (!path.isAbsolute(entryPoint)) {
          return resolveFrom(appDir, entryPoint);
        }
        return entryPoint;
      });
    }
  });
}

/** Perform all fs commits */
async function exportFromServerAsync(
  projectRoot: string,
  devServerManager: DevServerManager,
  { outputDir, baseUrl, exportServer, includeSourceMaps, routerRoot, files = new Map() }: Options
): Promise<ExportAssetMap> {
  const platform = 'web';
  const isExporting = true;
  const appDir = path.join(projectRoot, routerRoot);
  const injectFaviconTag = await getVirtualFaviconAssetsAsync(projectRoot, {
    outputDir,
    baseUrl,
    files,
  });

  const devServer = devServerManager.getDefaultDevServer();
  assert(devServer instanceof MetroBundlerDevServer);

  const [resources, { manifest, serverManifest, renderAsync }] = await Promise.all([
    devServer.getStaticResourcesAsync({
      includeSourceMaps,
    }),
    devServer.getStaticRenderFunctionAsync(),
  ]);

  makeRuntimeEntryPointsAbsolute(manifest, appDir);

  debug('Routes:\n', inspect(manifest, { colors: true, depth: null }));

  await getFilesToExportFromServerAsync(projectRoot, {
    files,
    manifest,
    exportServer,
    async renderAsync({ pathname, route }) {
      const template = await renderAsync(pathname);
      let html = await serializeHtmlWithAssets({
        isExporting,
        resources: resources.artifacts,
        template,
        baseUrl,
        route,
      });

      if (injectFaviconTag) {
        html = injectFaviconTag(html);
      }

      return html;
    },
  });

  getFilesFromSerialAssets(resources.artifacts, {
    platform,
    includeSourceMaps,
    files,
  });

  if (resources.assets) {
    // TODO: Collect files without writing to disk.
    // NOTE(kitten): Re. above, this is now using `files` except for iOS catalog output, which isn't used here
    await persistMetroAssetsAsync(resources.assets, {
      files,
      platform,
      outputDirectory: outputDir,
      baseUrl,
    });
  }

  if (exportServer) {
    const apiRoutes = await exportApiRoutesAsync({
      outputDir,
      server: devServer,
      manifest: serverManifest,
    });

    // Add the api routes to the files to export.
    for (const [route, contents] of apiRoutes) {
      files.set(route, contents);
    }
  } else {
    warnPossibleInvalidExportType(appDir);
  }

  return files;
}

export function getHtmlFiles({
  manifest,
  includeGroupVariations,
}: {
  manifest: ExpoRouterRuntimeManifest;
  includeGroupVariations?: boolean;
}): HtmlRequestLocation[] {
  const htmlFiles = new Set<Omit<HtmlRequestLocation, 'pathname'>>();

  function traverseScreens(
    screens: ExpoRouterRuntimeManifest['screens'],
    route: RouteNode | null,
    baseUrl = ''
  ) {
    for (const value of Object.values(screens)) {
      let leaf: string | null = null;
      if (typeof value === 'string') {
        leaf = value;
      } else if (Object.keys(value.screens).length === 0) {
        leaf = value.path;
        route = value._route ?? null;
      }

      if (leaf != null) {
        let filePath = baseUrl + leaf;

        if (leaf === '') {
          filePath =
            baseUrl === ''
              ? 'index'
              : baseUrl.endsWith('/')
                ? baseUrl + 'index'
                : baseUrl.slice(0, -1);
        } else if (
          // If the path is a collection of group segments leading to an index route, append `/index`.
          stripGroupSegmentsFromPath(filePath) === ''
        ) {
          filePath += '/index';
        }

        // This should never happen, the type of `string | object` originally comes from React Navigation.
        if (!route) {
          throw new Error(
            `Internal error: Route not found for "${filePath}" while collecting static export paths.`
          );
        }

        if (includeGroupVariations) {
          // TODO: Dedupe requests for alias routes.
          addOptionalGroups(filePath, route);
        } else {
          htmlFiles.add({
            filePath,
            route,
          });
        }
      } else if (typeof value === 'object' && value?.screens) {
        const newPath = baseUrl + value.path + '/';
        traverseScreens(value.screens, value._route ?? null, newPath);
      }
    }
  }

  function addOptionalGroups(path: string, route: RouteNode) {
    const variations = getPathVariations(path);
    for (const variation of variations) {
      htmlFiles.add({ filePath: variation, route });
    }
  }

  traverseScreens(manifest.screens, null);

  return uniqueBy(Array.from(htmlFiles), (value) => value.filePath).map((value) => {
    const parts = value.filePath.split('/');
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
    const filePathLocation = partsWithGroups.join('/');
    const filePath = filePathLocation + '.html';
    return {
      ...value,
      filePath,
      pathname: filePathLocation.replace(/(\/?index)?$/, ''),
    };
  });
}

function uniqueBy<T>(array: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of array) {
    const id = key(value);
    if (!seen.has(id)) {
      seen.add(id);
      result.push(value);
    }
  }
  return result;
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
  ...props
}: Pick<Options, 'outputDir'> & {
  server: MetroBundlerDevServer;
  manifest: ExpoRouterServerManifestV1;
}): Promise<ExportAssetMap> {
  const { manifest, files } = await server.exportExpoRouterApiRoutesAsync({
    outputDir: '_expo/functions',
    prerenderManifest: props.manifest,
  });

  Log.log(chalk.bold`Exporting ${files.size} API Routes.`);

  files.set('_expo/routes.json', {
    contents: JSON.stringify(manifest, null, 2),
    targetDomain: 'server',
  });

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
