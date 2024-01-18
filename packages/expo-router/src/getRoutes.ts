import { DynamicConvention, RouteNode } from './Route';
import {
  matchDeepDynamicRouteName,
  matchDynamicName,
  matchGroupName,
  removeSupportedExtensions,
} from './matchers';
import { RequireContext } from './types';

export type Options = {
  ignore?: RegExp[];
  preserveApiRoutes?: boolean;
  ignoreRequireErrors?: boolean;
  ignoreEntryPoints?: boolean;
  /* Used using testing for easier comparison */
  internal_stripLoadRoute?: boolean;
};

type DirectoryNode = {
  layout?: RouteNode[];
  name: string; // Just used for debugging
  files: Map<string, RouteNode[]>;
  subdirectories: Map<string, DirectoryNode>;
};

/**
 * Given a Metro context module, return an array of nested routes.
 *
 * This is a two step process:
 *  1. Convert the RequireContext keys (file paths) into a directory tree.
 *      - This should extrapolate array syntax into multiple routes
 *      - Routes are given a specificity score
 *  2. Flatten the directory tree into routes
 *      - Routes in directories without _layout files are hoisted to the nearest _layout
 *      - The name of the route is relative to the nearest _layout
 *      - If multiple routes have the same name, the most specific route is used
 */
export function getRoutes(contextModule: RequireContext, options: Options = {}): RouteNode | null {
  const directoryTree = getDirectoryTree(contextModule, options);

  // If there are no routes
  if (!directoryTree) {
    return null;
  }

  return flattenDirectoryTreeToRoutes(directoryTree, options);
}

/**
 * Converts a RequireContext keys (file paths) into a directory tree.
 */
function getDirectoryTree(contextModule: RequireContext, options: Options) {
  const ignoreList = getIgnoreList(options);
  let hasRoutes = false;
  let hasLayout = false;

  const directory: DirectoryNode = {
    name: '/',
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
    const leaves: Set<DirectoryNode> = new Set();
    for (const key of extrapolateGroups(meta.key)) {
      let directoryNode = directory;

      // Traverse the directory tree to its leaf node, creating any missing directories along the way
      const subdirectoryParts = key.replace(meta.filename, '').split('/').filter(Boolean);
      let name = '/';

      for (const part of subdirectoryParts) {
        name += part + '/';
        let subDirectory = directoryNode.subdirectories.get(part);
        if (!subDirectory) {
          subDirectory = {
            name,
            files: new Map(),
            subdirectories: new Map(),
          };
          directoryNode.subdirectories.set(part, subDirectory);
        }
        directoryNode = subDirectory;
      }

      // Add the leaf node to the list of leaves
      leaves.add(directoryNode);
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
      entryPoints: [filePath], // Additional entry points are added during hoisting
      route: meta.name, // This is overwritten during hoisting based upon the _layout
      dynamic: null, // This is calculated during hoisting
      children: [], // While we are building the directory tree, we don't know the node's children just yet. This is added during hoisting
    };

    if (meta.isLayout) {
      hasLayout ||= leaves.size > 0;
      for (const leaf of leaves) {
        leaf.layout ??= [];

        const existing = leaf.layout[meta.specificity];

        if (existing) {
          // In production, use the first route found
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(
              `The layouts "${filePath}" and ${existing.contextKey} conflict. Please remove or rename one of these files.`
            );
          }
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
              `The API route "${filePath}" and ${existing.contextKey} conflict. Please remove or rename one of these files.`
            );
          }
        }
      }
    } else {
      hasRoutes ||= leaves.size > 0;
      for (const leaf of leaves) {
        const name = `${leaf.name}${meta.name}`;
        let nodes = leaf.files.get(name);

        if (!nodes) {
          nodes = [];
          leaf.files.set(name, nodes);
        }

        const existing = nodes[meta.specificity];

        if (process.env.NODE_ENV === 'production') {
          nodes[meta.specificity] = node;
        } else {
          if (existing) {
            // In production, use the first route found
            if (process.env.NODE_ENV !== 'production') {
              throw new Error(
                `The route files "${filePath}" and ${existing.contextKey} conflict on the route "${name}". Please remove or rename one of these files.`
              );
            }
          } else {
            nodes[meta.specificity] = node;
          }
        }
      }
    }
  }

  // If there are no routes/layouts then we should display the tutorial.
  if (!hasLayout && !hasRoutes) {
    return null;
  }

  // If there are no top-level _layout, add a default _layout
  if (!directory.layout) {
    directory.layout = [
      {
        loadRoute: () => ({
          default: (require('./views/Navigator') as typeof import('./views/Navigator'))
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

  // Only include the sitemap if there are routes.
  if (hasRoutes) {
    appendSitemapRoute(directory);
  }

  appendNotFoundRoute(directory);

  return directory;
}

/**
 * Flatten the directory tree into routes, hoisting routes to the nearest _layout.
 */
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
    // TODO: In this implementation, everything has a specificity of 0. When we introduce Platform Routes, we need to pick the most specific layout.
    const layout = directory.layout[0];

    // The first _layout is the root layout. It doesn't have a parent
    if (nearestLayout) {
      nearestLayout.children.push(layout);
    }
    nearestLayout = layout;

    // `route` is the absolute pathname. We need to make this relative to the parent layout
    const newRoute = nearestLayout.route.replace(pathToRemove, '');
    pathToRemove = nearestLayout.route ? `${nearestLayout.route}/` : '';
    nearestLayout.route = newRoute;

    nearestLayout.dynamic = getDynamicConvention(nearestLayout.route);

    if (nearestLayout.entryPoints) {
      // Track this _layout's entryPoints so that child routes can inherit them
      entryPoints = [...entryPoints, ...nearestLayout.entryPoints];

      // Layouts never have entryPoints
      delete nearestLayout.entryPoints;
    }

    if (options.internal_stripLoadRoute) {
      delete (nearestLayout as any).loadRoute;
    }
  }

  // This should never occur, but it makes the type system happy
  if (!nearestLayout) throw new Error('Expo Router Internal Error: No nearest layout');

  for (const routes of directory.files.values()) {
    // TODO: In this implementation, everything has a specificity of 0. When we introduce Platform Routes, we need to pick the most specific route.
    const route = routes[0];

    // `route` is the absolute pathname. We need to make this relative to the parent layout
    const name = route.route.replace(pathToRemove, '');

    // Merge the entryPoints of the parent layout(s) with the child route
    const childEntryPoints = new Set(entryPoints);
    if (route.entryPoints?.[0]) {
      childEntryPoints.add(route.entryPoints[0]);
    }

    const child: RouteNode = {
      ...route,
      route: name,
      dynamic: getDynamicConvention(name),
      entryPoints: [...childEntryPoints],
    };

    if (options.ignoreEntryPoints) {
      delete (child as any).entryPoints;
    }

    if (options.internal_stripLoadRoute) {
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

function getFileMeta(key: string, options: Options) {
  // Remove the leading `./`
  key = key.replace(/^\.\//, '');

  const parts = key.split('/');
  const dirname = parts.slice(0, -1).join('/') || './';
  const filename = parts[parts.length - 1];
  const filepathWithoutExtensions = removeSupportedExtensions(key);
  const filenameWithoutExtensions = removeSupportedExtensions(filename);
  const isLayout = filename.startsWith('_layout.');
  const isApi = key.match(/\+api\.[jt]sx?$/);

  if (filenameWithoutExtensions.startsWith('(') && filenameWithoutExtensions.endsWith(')')) {
    throw new Error(`Invalid route ./${key}. Routes cannot end with \`(group)\` syntax`);
  }

  return {
    key,
    name: filenameWithoutExtensions,
    specificity: 0,
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

function getDynamicConvention(path: string): DynamicConvention[] | null {
  const dynamic = path
    .split('/')
    .map((part): DynamicConvention | null => {
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

function appendSitemapRoute(directory: DirectoryNode) {
  if (directory.files.has('_sitemap')) {
    return;
  }

  directory.files.set('_sitemap', [
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

function appendNotFoundRoute(directory: DirectoryNode) {
  if (directory.files.has('+not-found')) {
    return;
  }

  directory.files.set('+not-found', [
    {
      loadRoute() {
        return { default: require('./views/Unmatched').Unmatched };
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
