import { DynamicConvention, RouteNode } from './Route';
import {
  matchArrayGroupName,
  matchDeepDynamicRouteName,
  matchDynamicName,
  removeSupportedExtensions,
} from './matchers';
import { RequireContext } from './types';

export type Options = {
  ignore?: RegExp[];
  preserveApiRoutes?: boolean;
  ignoreRequireErrors?: boolean;
  ignoreEntryPoints?: boolean;
  /* Used to simplify testing for toEqual() comparison */
  internal_stripLoadRoute?: boolean;
  /* Used to simplify by skipping the generated routes */
  internal_skipGenerated?: boolean;
};

type DirectoryNode = {
  layout?: RouteNode[];
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
 * Converts the RequireContext keys (file paths) into a directory tree.
 */
function getDirectoryTree(contextModule: RequireContext, options: Options) {
  const ignoreList = [/^\.\/\+html\.[tj]sx?$/];
  if (options.ignore) {
    ignoreList.push(...options.ignore);
  }
  if (options.preserveApiRoutes !== true) {
    ignoreList.push(/\+api\.[tj]sx?$/);
  }

  const rootDirectory: DirectoryNode = {
    files: new Map(),
    subdirectories: new Map(),
  };

  let hasRoutes = false;
  let hasLayout = false;

  for (const filePath of contextModule.keys()) {
    if (ignoreList.some((regex) => regex.test(filePath))) {
      continue;
    }

    const meta = getFileMeta(filePath);

    // This is a file that should be ignored. e.g maybe it has an invalid platform?
    if (meta.specificity < 0) {
      continue;
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
      route: '', // This is overwritten during hoisting based upon the _layout
      dynamic: getDynamicConvention(meta.route),
      children: [], // While we are building the directory tree, we don't know the node's children just yet. This is added during hoisting
    };

    /**
     * A single filepath may be extrapolated into multiple routes if it contains array syntax.
     * Another way to thinking about is that a filepath node is present in multiple leaves of the directory tree.
     */
    for (const route of extrapolateGroups(meta.route)) {
      // Traverse the directory tree to its leaf node, creating any missing directories along the way
      const subdirectoryParts = route.split('/').slice(0, -1);

      // Start at the root directory and traverse the path to the leaf directory
      let directory = rootDirectory;

      for (const part of subdirectoryParts) {
        let subDirectory = directory.subdirectories.get(part);

        // Create any missing subdirectories
        if (!subDirectory) {
          subDirectory = {
            files: new Map(),
            subdirectories: new Map(),
          };
          directory.subdirectories.set(part, subDirectory);
        }

        directory = subDirectory;
      }

      // Clone the node for this route
      const routeNode: RouteNode = { ...node, route };

      if (meta.isLayout) {
        directory.layout ??= [];
        const existing = directory.layout[meta.specificity];
        if (existing) {
          // In production, use the first route found
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(
              `The layouts "${filePath}" and ${existing.contextKey} conflict. Please remove or rename one of these files.`
            );
          }
        } else {
          directory.layout[meta.specificity] = {
            ...routeNode,
            route: routeNode.route.replace(/\/?_layout$/, ''),
          };
          hasLayout ||= true;
        }
      } else if (meta.isApi) {
        let nodes = directory.files.get(route);

        if (!nodes) {
          nodes = [];
          directory.files.set(route, nodes);
        }

        // TODO(Platform Route): Throw error if specificity > 0, as you cannot specify platform extensions for api routes

        const existing = nodes[0];
        if (existing) {
          // In production, use the first route found
          if (process.env.NODE_ENV === 'production') {
            throw new Error(
              `The API route "${filePath}" and ${existing.contextKey} conflict. Please remove or rename one of these files.`
            );
          }
        } else {
          nodes[0] = routeNode;
        }
      } else {
        let nodes = directory.files.get(route);

        if (!nodes) {
          nodes = [];
          directory.files.set(route, nodes);
        }

        /**
         * If there is an existing node with the same specificity, then we have a conflict.
         * NOTE(Platform Routes):
         *    We cannot check for specificity conflicts here, as we haven't processed all the context keys yet!
         *    This will be checked during hoisting, as well as enforcing that all routes have a non-platform route.
         */
        const existing = nodes[meta.specificity];
        if (existing) {
          // In production, use the first route found
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(
              `The route files "${filePath}" and ${existing.contextKey} conflict on the route "/${route}". Please remove or rename one of these files.`
            );
          }
        } else {
          nodes[meta.specificity] = routeNode;
          hasRoutes ||= true;
        }
      }
    }
  }

  // If there are no routes/layouts then we should display the tutorial.
  if (!hasLayout && !hasRoutes) {
    return null;
  }

  // If there are no top-level _layout, add a default _layout
  if (!rootDirectory.layout) {
    rootDirectory.layout = [
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
  if (hasRoutes && !options.internal_skipGenerated) {
    appendSitemapRoute(rootDirectory);
  }

  if (!options.internal_skipGenerated) {
    appendNotFoundRoute(rootDirectory);
  }
  return rootDirectory;
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
    // TODO(Platform Routes): We need to pick the most specific layout.
    const layout = directory.layout[0];

    const previousNearestLayout = nearestLayout;
    nearestLayout = { ...layout, children: [] };

    // Add the new layout as a child of its parent
    if (previousNearestLayout) {
      previousNearestLayout.children.push(nearestLayout);
    }

    if (options.internal_stripLoadRoute) {
      delete (nearestLayout as any).loadRoute;
    }

    // `route` is the absolute pathname. We need to make this relative to the parent layout
    const newRoute = nearestLayout.route.replace(pathToRemove, '');
    pathToRemove = nearestLayout.route ? `${nearestLayout.route}/` : '';
    nearestLayout.route = newRoute;

    if (nearestLayout.entryPoints) {
      // Track this _layout's entryPoints so that child routes can inherit them
      entryPoints = [...entryPoints, ...nearestLayout.entryPoints];

      // Layouts never have entryPoints
      delete nearestLayout.entryPoints;
    }
  }

  // This should never occur, but it makes the type system happy
  if (!nearestLayout) throw new Error('Expo Router Internal Error: No nearest layout');

  for (const routes of directory.files.values()) {
    // TODO(Platform Routes): We need to pick the most specific layout and ensure that all routes have a non-platform route.
    let routeNode = routes[0];

    // `route` is the absolute pathname. We need to make this relative to the nearest layout
    const route = routeNode.route.replace(pathToRemove, '');

    // Merge the entryPoints of the parent layout(s) with the child route
    const childEntryPoints = options.ignoreEntryPoints
      ? undefined
      : [...entryPoints, ...(routeNode.entryPoints || [])];

    routeNode = {
      ...routeNode,
      route,
      entryPoints: childEntryPoints,
    };

    if (options.internal_stripLoadRoute) {
      delete (routeNode as any).loadRoute;
    }

    nearestLayout.children.push(routeNode);
  }

  // Recursively flatten the subdirectories
  for (const child of directory.subdirectories.values()) {
    flattenDirectoryTreeToRoutes(child, options, nearestLayout, entryPoints, pathToRemove);
  }

  return nearestLayout;
}

function getFileMeta(key: string) {
  // Remove the leading `./`
  key = key.replace(/^\.\//, '');

  const parts = key.split('/');
  const filename = parts[parts.length - 1];
  const filenameWithoutExtensions = removeSupportedExtensions(filename);
  const isLayout = filenameWithoutExtensions === '_layout';
  const isApi = filenameWithoutExtensions.match(/\+api$/);

  if (filenameWithoutExtensions.startsWith('(') && filenameWithoutExtensions.endsWith(')')) {
    throw new Error(`Invalid route ./${key}. Routes cannot end with '(group)' syntax`);
  }

  return {
    route: removeSupportedExtensions(key),
    specificity: 0,
    isLayout,
    isApi,
  };
}

export function getIgnoreList(options?: Options) {
  const ignore: RegExp[] = [/^\.\/\+html\.[tj]sx?$/, ...(options?.ignore ?? [])];
  if (options?.preserveApiRoutes !== true) {
    ignore.push(/\+api\.[tj]sx?$/);
  }
  return ignore;
}

/**
 * Generates a set of strings which have the router array syntax extrapolated.
 *
 * /(a,b)/(c,d)/e.tsx => new Set(['a/c/e.tsx', 'a/d/e.tsx', 'b/c/e.tsx', 'b/d/e.tsx'])
 */
function extrapolateGroups(key: string, keys: Set<string> = new Set()): Set<string> {
  const match = matchArrayGroupName(key)?.[0];

  if (!match) {
    keys.add(key);
    return keys;
  }
  const groups = match.split(',');
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
  if (!directory.files.has('_sitemap')) {
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
}

function appendNotFoundRoute(directory: DirectoryNode) {
  if (!directory.files.has('+not-found')) {
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
}
