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
  /* Used using testing for toEqual() comparison */
  internal_stripLoadRoute?: boolean;
};

type DirectoryNode = {
  layout?: RouteNode[];
  name: string;
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
    name: '/',
    files: new Map(),
    subdirectories: new Map(),
  };

  let hasRoutes = false;
  let hasLayout = false;

  for (const filePath of contextModule.keys()) {
    if (ignoreList.some((regex) => regex.test(filePath))) {
      continue;
    }

    const meta = getFileMeta(filePath, options);

    // This is a file that should be ignored. e.g maybe it has an invalid platform?
    if (meta.specificity < 0) {
      continue;
    }

    /**
     * A single filepath may be extrapolated into multiple routes if it contains array syntax.
     * Another way to thinking about is that a filepath node is present in multiple leaves of the directory tree.
     *
     * First we create the node and then form the collection of leaves it should be present in
     */
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

    const leaves = new Set<DirectoryNode>();
    for (const virtualFilePath of extrapolateGroups(meta.key)) {
      // Traverse the directory tree to its leaf node, creating any missing directories along the way
      const subdirectoryParts = virtualFilePath
        .replace(meta.filename, '')
        .split('/')
        .filter(Boolean);

      // Start at the root directory and traverse the path to the leaf directory
      let directory = rootDirectory;
      let name = rootDirectory.name;

      for (const part of subdirectoryParts) {
        name += part + '/';
        let subDirectory = directory.subdirectories.get(part);

        // Create any missing subdirectories
        if (!subDirectory) {
          subDirectory = {
            name,
            files: new Map(),
            subdirectories: new Map(),
          };
          directory.subdirectories.set(part, subDirectory);
        }

        directory = subDirectory;
      }

      // Add the leaf node to the list of leaves
      leaves.add(directory);
    }

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
          nodes = [node];
          leaf.files.set(meta.name, nodes);
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
          nodes[0] = node;
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
              `The route files "${filePath}" and ${existing.contextKey} conflict on the route "${name}". Please remove or rename one of these files.`
            );
          }
        } else {
          nodes[meta.specificity] = node;
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
  if (hasRoutes) {
    appendSitemapRoute(rootDirectory);
  }

  appendNotFoundRoute(rootDirectory);

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
    // TODO(Platform Routes): We need to pick the most specific layout and ensure that all routes have a non-platform route.
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
