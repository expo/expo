import type { Platform } from 'react-native';

import { DynamicConvention, RouteNode } from '../Route';
import {
  matchDeepDynamicRouteName,
  matchDynamicName,
  matchGroupName,
  removeSupportedExtensions,
} from '../matchers';
import { RequireContext } from '../types';

export type Options = {
  ignore?: RegExp[];
  preserveApiRoutes?: boolean;
  ignoreRequireErrors?: boolean;
  ignoreEntryPoints?: boolean;
  unstable_platform?: typeof Platform.OS;
  /* Used using testing for easier comparison */
  unstable_stripLoadRoute?: boolean;
  unstable_improvedErrorMessages?: boolean;
};

type DirectoryNode = {
  layout?: RouteNode[];
  files: Map<string, RouteNode[]>;
  subdirectories: Map<string, DirectoryNode>;
};

const validPlatforms = new Set(['android', 'ios', 'windows', 'osx', 'native', 'web']);

/** Given a Metro context module, return an array of nested routes. */
export function getRoutes(contextModule: RequireContext, options: Options = {}): RouteNode | null {
  const directoryTree = getDirectoryTree(contextModule, options);

  // If there are no routes
  if (!directoryTree) {
    return null;
  }

  return flattenDirectoryTreeToRoutes(directoryTree, options);
}

function getDirectoryTree(contextModule: RequireContext, options: Options) {
  const ignoreList = getIgnoreList(options);
  let hasRoutes = false;
  let hasLayout = false;

  const directory: DirectoryNode = {
    files: new Map(),
    subdirectories: new Map(),
  };

  for (const filePath of contextModule.keys()) {
    if (ignoreList.some((regex) => regex.test(filePath))) {
      continue;
    }

    const meta = getFileMeta(filePath, options);

    // This is a file that should be ignored. e.g maybe it has an invalid platform
    if (meta.specificity < 0) {
      continue;
    }

    // A single file may be extrapolated into multiple routes if it contains array syntax
    const leaves: DirectoryNode[] = [];
    for (const key of extrapolateGroups(meta.key)) {
      let directoryNode = directory;

      // Traverse the directory tree to its leaf node, creating any missing directories along the way
      const subdirectoryParts = key.replace(meta.filename, '').split('/').filter(Boolean);
      for (const part of subdirectoryParts) {
        let child = directoryNode.subdirectories.get(part);
        if (!child) {
          child = {
            files: new Map(),
            subdirectories: new Map(),
          };
          directoryNode.subdirectories.set(part, child);
        }
        directoryNode = child;
      }

      // Add the leaf node to the list of leaves
      leaves.push(directoryNode);
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
      entryPoints: [filePath],
      route: meta.name, // This is overwritten during hoisting
      dynamic: null, // This is calculated during hoisting
      children: [],
    };

    if (meta.isLayout) {
      hasLayout ||= leaves.length > 0;
      for (const leaf of leaves) {
        leaf.layout ??= [];

        const existing = leaf.layout[meta.specificity];

        if (existing) {
          throw new Error(
            `The layouts "${filePath}" and ${existing.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`
          );
        } else {
          leaf.layout[meta.specificity] = node;
        }
      }
    } else if (meta.isApi) {
      for (const leaf of leaves) {
        let nodes = leaf.files.get(meta.name);

        if (!nodes) {
          nodes = [];
          leaf.files.set(meta.name, [node]);
        } else {
          const existing = nodes[0];
          if (process.env.NODE_ENV === 'production') {
            nodes[0] = node;
          } else {
            throw new Error(
              `The API route "${filePath}" and ${existing.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`
            );
          }
        }
      }
    } else {
      hasRoutes ||= leaves.length > 0;
      for (const leaf of leaves) {
        let nodes = leaf.files.get(meta.name);

        if (!nodes) {
          nodes = [];
          leaf.files.set(meta.name, nodes);
        }

        const existing = nodes[meta.specificity];

        if (process.env.NODE_ENV === 'production') {
          nodes[meta.specificity] = node;
        } else {
          if (existing) {
            if (options.unstable_improvedErrorMessages) {
              throw new Error(
                `The routes "${filePath}" and ${existing.contextKey} conflict in "${meta.dirname}. Please remove one of these files.`
              );
            } else {
              throw new Error(
                `Multiple files match the route name "./${meta.filepathWithoutExtensions}".`
              );
            }
          } else {
            nodes[meta.specificity] = node;
          }
        }
      }
    }
  }

  // If there are no layout files, add the global default
  if (!directory.layout) {
    directory.layout = [
      {
        loadRoute: () => ({
          default: (require('../views/Navigator') as typeof import('../views/Navigator'))
            .DefaultNavigator,
        }),
        // Generate a fake file name for the directory
        contextKey: './_layout.tsx',
        entryPoints: ['expo-router/build/views/Navigator.js'],
        route: '',
        generated: true,
        dynamic: null,
        children: [],
      },
    ];
  }

  // If there are no routes
  if (!hasLayout && !hasRoutes) {
    return null;
  }

  // Only include the sitemap if there are routes.
  if (hasRoutes) {
    appendSitemapRoute(directory);
  }

  appendNotFoundRoute(directory);

  return directory;
}

function appendSitemapRoute(directory: DirectoryNode) {
  if (directory.files.has('_sitemap')) {
    return;
  }

  directory.files.set('_sitemap', [
    {
      loadRoute() {
        const { Sitemap, getNavOptions } = require('../views/Sitemap');
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

function appendNotFoundRoute(directory: DirectoryNode) {
  if (directory.files.has('+not-found')) {
    return;
  }

  directory.files.set('+not-found', [
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

function flattenDirectoryTreeToRoutes(
  directory: DirectoryNode,
  options: Options,
  /* The nearest _layout file in the directory tree */
  nearestLayout?: RouteNode,
  /* Routes need to contain the entryPoints of their parent layouts */
  entryPoints: string[] = [],
  /* Route names are relative to their layout */
  pathToRemove = ''
) {
  /**
   * All routes get "hoisted" to the nearest layout.
   */
  if (directory.layout) {
    const layout = getMostSpecific(directory.layout);

    // The first _layout is the root layout. It doesn't have a parent
    if (nearestLayout) {
      nearestLayout.children.push(layout);
    }
    nearestLayout = layout;

    // `route` is the absolute pathname. We need to make this relative to the parent layout
    const newRoute = nearestLayout.route.replace(pathToRemove, '');
    pathToRemove = nearestLayout.route ? `${nearestLayout.route}/` : '';
    nearestLayout.route = newRoute;

    nearestLayout.dynamic = generateDynamic(nearestLayout.route);

    if (nearestLayout.entryPoints) {
      // Track this _layout's entryPoints so that child routes can inherit them
      entryPoints = [...entryPoints, ...nearestLayout.entryPoints];

      // Layouts never have entryPoints
      delete nearestLayout.entryPoints;
    }

    if (options.unstable_stripLoadRoute) {
      delete (nearestLayout as any).loadRoute;
    }
  }

  // This should never occur, but it makes the type system happy
  if (!nearestLayout) return null;

  for (const routes of directory.files.values()) {
    const route = getMostSpecific(routes);

    // `route` is the absolute pathname. We need to make this relative to the parent layout
    const name = route.route.replace(pathToRemove, '');

    // Merge the entryPoints of the parent layout(s) with the child route
    const childEntryPoints = new Set(entryPoints);
    if (route.entryPoints?.[0]) {
      childEntryPoints.add(route.entryPoints[0]);
    }

    const child = {
      ...route,
      route: name,
      dynamic: generateDynamic(name),
      entryPoints: [...childEntryPoints],
    };

    if (options.ignoreEntryPoints) {
      delete (child as any).entryPoints;
    }

    if (options.unstable_stripLoadRoute) {
      delete (child as any).loadRoute;
    }

    nearestLayout.children.push(child);
  }

  // Recursively flatten the subdirectories
  for (const child of directory.subdirectories.values()) {
    flattenDirectoryTreeToRoutes(child, options, nearestLayout, entryPoints, pathToRemove);
  }

  return nearestLayout;
}

function getMostSpecific(routes: RouteNode[]) {
  const route = routes[routes.length - 1];

  if (!routes[0]) {
    throw new Error(`${route.contextKey} does not contain a non-platform fallback route`);
  }

  return routes[routes.length - 1];
}

function getFileMeta(key: string, options: Options) {
  // Remove the leading `./`
  key = key.replace(/^\.\//, '');

  const parts = key.split('/');
  const dirname = parts.slice(0, -1).join('/');
  const filename = parts[parts.length - 1];
  const filepathWithoutExtensions = removeSupportedExtensions(key);
  const filenameWithoutExtensions = removeSupportedExtensions(filename);
  const isLayout = filename.startsWith('_layout.');
  const isApi = key.match(/\+api\.[jt]sx?$/);
  let name = isLayout
    ? filepathWithoutExtensions.replace(/\/?_layout$/, '')
    : filepathWithoutExtensions;

  if (filenameWithoutExtensions.startsWith('(') && filenameWithoutExtensions.endsWith(')')) {
    if (options.unstable_improvedErrorMessages) {
      throw new Error(`Invalid route ./${key}. Routes cannot end with \`(group)\` syntax`);
    } else {
      throw new Error(
        `Using deprecated Layout Route format: Move \`./app/${key}\` to \`./app/${filepathWithoutExtensions}/_layout.js\``
      );
    }
  }

  const filenameParts = filenameWithoutExtensions.split('.');
  const platform = filenameParts[filenameParts.length - 1];
  const hasPlatform = validPlatforms.has(platform);

  let specificity = 0;
  if (options.unstable_platform && hasPlatform) {
    if (platform === options.unstable_platform) {
      specificity = 2;
    } else if (platform === 'native' && options.unstable_platform !== 'web') {
      specificity = 1;
    } else {
      specificity = -1;
    }

    if (isApi && specificity !== 0) {
      throw new Error(
        `Api routes cannot have platform extensions. Please remove ${platform} from ./${key}`
      );
    }

    name = name.replace(new RegExp(`.${platform}$`), '');
  } else if (hasPlatform) {
    if (validPlatforms.has(platform)) {
      throw new Error('invalid route with platform extension');
    }
  }

  return {
    key,
    name,
    specificity,
    dirname,
    filename,
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

function generateDynamic(path: string) {
  const dynamic: RouteNode['dynamic'] = path
    .split('/')
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

  if (dynamic?.length === 0) {
    return null;
  }

  return dynamic;
}
