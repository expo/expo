import { Platform } from 'react-native';

import { DynamicConvention, RouteNode } from '../Route';
import {
  matchDeepDynamicRouteName,
  matchDynamicName,
  matchGroupName,
  removeSupportedExtensions,
} from '../matchers';
import { RequireContext } from '../types';

type Options = {
  ignore?: RegExp[];
  preserveApiRoutes?: boolean;
  ignoreRequireErrors?: boolean;
  ignoreEntryPoints?: boolean;
  platformExtensions?: boolean;
  stripLoadRoute?: boolean;
  improvedGeneratedRoutes?: boolean;
};

type DirectoryNode = {
  layout?: RouteNode;
  views: Map<string, RouteNode[]>;
  subdirectories: Map<string, DirectoryNode>;
};

const validPlatforms = new Set(['android', 'ios', 'windows', 'osx', 'native', 'web']);

/** Given a Metro context module, return an array of nested routes. */
export function getRoutes(contextModule: RequireContext, options: Options = {}): RouteNode | null {
  const directoryTree = getDirectoryTree(contextModule, options);

  // If there are no routes
  if (directoryTree.views.size === 0 && directoryTree.subdirectories.size === 0) {
    return null;
  }

  // Add the generated routes
  if (options.improvedGeneratedRoutes) {
    appendSitemapRoute(directoryTree);
    appendNotFoundRoute(directoryTree);
    hoistRoutesToNearestLayout(directoryTree, options);
  } else {
    const entryPoints = directoryTree.layout!.entryPoints || [];
    hoistRoutesToNearestLayout(directoryTree, options);
    legacy_appendSitemapRoute(directoryTree.layout!, entryPoints);
    legacy_appendNotFoundRoute(directoryTree.layout!, entryPoints);
  }

  // There will always be a root layout
  return directoryTree.layout!;
}

function getDirectoryTree(contextModule: RequireContext, options: Options) {
  const ignoreList = getIgnoreList(options);

  const directory: DirectoryNode = {
    views: new Map(),
    subdirectories: new Map(),
  };

  for (const filePath of contextModule.keys()) {
    if (ignoreList.some((regex) => regex.test(filePath))) {
      continue;
    }

    const meta = getFileMeta(filePath, options);

    const leaves: DirectoryNode[] = [];
    for (const key of extrapolateGroups(filePath)) {
      let node = directory;
      for (const part of key.split('/').slice(1, -1)) {
        let child = node.subdirectories.get(part);
        if (!child) {
          child = {
            views: new Map(),
            subdirectories: new Map(),
          };
          node.subdirectories.set(part, child);
        }
        node = child;
      }
      leaves.push(node);
    }

    const node: RouteNode = {
      loadRoute() {
        if (options.ignoreRequireErrors) {
          try {
            return contextModule(filePath);
          } catch {
            return {};
          }
        } else {
          return contextModule(filePath);
        }
      },
      contextKey: filePath,
      route: meta.name,
      dynamic: meta.dynamic,
      children: [],
      entryPoints: [filePath],
    };

    if (meta.isLayout) {
      for (const leaf of leaves) {
        if (leaf.layout && leaf.layout !== node) {
          throw new Error(
            `The layouts "${filePath}" and ${leaf.layout.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`
          );
        } else {
          leaf.layout = node;
        }
      }
    } else if (meta.isApi) {
      for (const leaf of leaves) {
        const existing = leaf.views.get(meta.filepathWithoutExtensions);
        if (existing) {
          throw new Error(
            `The API routes "${filePath}" and ${existing[0].contextKey} conflict in "${meta.dirname}. Please remove one of these files.`
          );
        } else {
          leaf.layout = node;
        }

        leaf.views.set(meta.filepathWithoutExtensions, [node]);
      }
    } else {
      for (const leaf of leaves) {
        let nodes = leaf.views.get(meta.filename);

        if (!nodes) {
          nodes = [];
          leaf.views.set(meta.filepathWithoutExtensions, nodes);
        }

        const existing = nodes[meta.specificity];
        if (existing) {
          throw new Error(
            `The routes "${filePath}" and ${existing.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`
          );
        } else {
          nodes[meta.specificity] = node;
        }
      }
    }
  }

  if (!directory.layout) {
    directory.layout = {
      loadRoute: () => ({
        default: (require('./views/Navigator') as typeof import('../views/Navigator'))
          .DefaultNavigator,
      }),
      // Generate a fake file name for the directory
      contextKey: './_layout.tsx',
      entryPoints: ['expo-router/build/views/Navigator.js'],
      route: '',
      generated: true,
      dynamic: null,
      children: [],
    };
  }

  return directory;
}

function appendSitemapRoute(directory: DirectoryNode) {
  if (directory.views.has('_sitemap')) {
    return;
  }

  directory.views.set('_sitemap', [
    {
      loadRoute() {
        const { Sitemap, getNavOptions } = require('./views/Sitemap');
        return { default: Sitemap, getNavOptions };
      },
      route: '_sitemap',
      contextKey: './_sitemap.tsx',
      generated: true,
      internal: true,
      dynamic: null,
      children: [],
      entryPoints: ['expo-router/build/views/Sitemap.js'],
    },
  ]);
}

function legacy_appendSitemapRoute(route: RouteNode, entryPoints: string[] = []) {
  const hasSitemap = route.children.some((child) => child.route === '_sitemap');
  if (hasSitemap) return;

  route.children.push({
    loadRoute() {
      const { Sitemap, getNavOptions } = require('./views/Sitemap');
      return { default: Sitemap, getNavOptions };
    },
    route: '_sitemap',
    contextKey: './_sitemap.tsx',
    generated: true,
    internal: true,
    dynamic: null,
    children: [],
    entryPoints: [...entryPoints, 'expo-router/build/views/Sitemap.js'],
  });
}

function appendNotFoundRoute(directory: DirectoryNode) {
  if (directory.views.has('+not-found')) {
    return;
  }

  directory.views.set('+not-found', [
    {
      loadRoute() {
        return { default: require('../views/Unmatched').Unmatched };
      },
      route: '+not-found',
      contextKey: './+not-found.tsx',
      generated: true,
      internal: true,
      dynamic: [{ name: '+not-found', deep: true, notFound: true }],
      children: [],
      entryPoints: ['expo-router/build/views/Unmatched.js'],
    },
  ]);
}

function legacy_appendNotFoundRoute(route: RouteNode, entryPoints: string[] = []) {
  const hasNotFound = route.children.some((child) => child.route === '+not-found');
  if (hasNotFound) return;

  route.children.push({
    loadRoute() {
      return { default: require('../views/Unmatched').Unmatched };
    },
    route: '+not-found',
    contextKey: './+not-found.tsx',
    generated: true,
    internal: true,
    dynamic: [{ name: '+not-found', deep: true, notFound: true }],
    children: [],
    entryPoints: [...entryPoints, 'expo-router/build/views/Unmatched.js'],
  });
}

function hoistRoutesToNearestLayout(
  directory: DirectoryNode,
  options: Options,
  parent?: RouteNode,
  entryPoints: string[] = []
) {
  if (directory.layout) {
    if (parent) {
      parent.children.push(directory.layout);
    }

    parent = directory.layout;
    if (directory.layout.entryPoints) {
      entryPoints.push(...directory.layout.entryPoints);
      delete directory.layout.entryPoints;
    }

    // This is only used for testing for easier comparison
    if (options.stripLoadRoute) {
      delete (directory.layout as any).loadRoute;
    }
  }

  if (!parent) return;

  for (const routes of directory.views.values()) {
    const route = getMostSpecificRoute(routes);

    const child = {
      ...route,
      entryPoints: Array.from(new Set([...entryPoints, ...(route.entryPoints || [])])),
    };

    // This is only used for testing for easier comparison
    if (options.stripLoadRoute) {
      delete (child as any).loadRoute;
    }

    parent.children.push(child);
  }

  for (const child of directory.subdirectories.values()) {
    hoistRoutesToNearestLayout(child, options, parent, entryPoints);
  }
}

function getMostSpecificRoute(routes: RouteNode[]) {
  const route = routes[routes.length - 1];

  if (!routes[0]) {
    throw new Error(`${route.contextKey} does not contain a fallback platform route`);
  }

  return routes[routes.length - 1];
}

function getFileMeta(key: string, options: Options) {
  const parts = key.split('/');
  const dirname = parts.slice(1, -1).join('/');
  const filename = parts[parts.length - 1];
  const filenameParts = filename.split('.');

  let platform;
  if (options.platformExtensions) {
    if (filenameParts.length > 2) {
      const possiblePlatform = filenameParts[filenameParts.length - 2];
      if (validPlatforms.has(possiblePlatform)) {
        platform = possiblePlatform;
      }
    }
  } else {
    if (filenameParts.length > 2) {
      const possiblePlatform = filenameParts[filenameParts.length - 2];
      if (validPlatforms.has(possiblePlatform)) {
        throw new Error('invalid route with platform extension');
      }
    }
  }

  const filepathWithoutExtensions = removeSupportedExtensions(key);

  let dynamic: RouteNode['dynamic'] = parts
    .map((part) => {
      if (part === '+not-found') {
        return {
          name: '+not-found',
          deep: true,
          notFound: true,
        };
      }

      const deepDynamicName = matchDeepDynamicRouteName(part);
      const dynamicName = deepDynamicName ?? matchDynamicName(part);
      if (!dynamicName) return null;
      return { name: dynamicName, deep: !!deepDynamicName };
    })
    .filter((part): part is DynamicConvention => !!part);

  if (dynamic.length === 0) dynamic = null;

  const isLayout = filepathWithoutExtensions.endsWith('_layout.tsx');
  const isApi = key.match(/\+api\.[jt]sx?$/);

  const name = removeSupportedExtensions(parts.slice(1).join('/'));

  let specificity = 0;

  if (platform) {
    if (platform === Platform.OS) {
      specificity = 2;
    } else if (platform === 'native' && Platform.OS !== 'web') {
      specificity = 1;
    }
  }

  return {
    key,
    name,
    specificity,
    parts,
    dirname,
    filename,
    dynamic,
    isLayout,
    isApi,
    filepathWithoutExtensions,
  };
}

function getIgnoreList(options?: Options) {
  const ignore: RegExp[] = [/^\.\/\+html\.[tj]sx?$/, ...(options?.ignore ?? [])];
  if (options?.preserveApiRoutes !== true) {
    ignore.push(/\+api\.[tj]sx?$/);
  }
  return ignore;
}

function extrapolateGroups(key: string, keys: Set<string> = new Set()): Set<string> {
  const match = matchGroupName(key);

  if (!match) {
    keys.add(key);
    return keys;
  }

  const groups = match?.split(',');
  const groupsSet = new Set(groups);

  if (groupsSet.size !== groups.length) {
    throw new Error(`Array syntax cannot contain duplicate group name "${groups}" in "${key}".`);
  }

  if (groups.length === 1) {
    keys.add(key);
    return keys;
  }

  for (const group of groups) {
    extrapolateGroups(key.replace(match, group.trim()), keys);
  }

  return keys;
}
