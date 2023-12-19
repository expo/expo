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
};

type DirectoryNode = {
  layout?: RouteNode;
  views: Map<string, RouteNode[]>;
  subdirectories: Map<string, DirectoryNode>;
};

/** Given a Metro context module, return an array of nested routes. */
export function getRoutes(contextModule: RequireContext, options: Options = {}): RouteNode | null {
  const directoryTree = getDirectoryTree(contextModule, options);

  // If there is no route, return an empty route.
  if (directoryTree.views.size === 0 && directoryTree.subdirectories.size === 0) {
    return null;
  }

  // There will always be a root layout
  const routeNode = directoryTree.layout!;

  hoistDirectoryTree(directoryTree, routeNode, options);

  return routeNode;
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

    const meta = getFileMeta(filePath);

    const leaves: DirectoryNode[] = [];
    for (const key of extrapolateGroups(filePath)) {
      let node = directory;

      for (const part of key.split('/').slice(0, -1)) {
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
      route: meta.filename,
      generated: true,
      dynamic: meta.dynamic,
      children: [],
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

  return directory;
}

function hoistDirectoryTree(
  directory: DirectoryNode,
  parent: RouteNode,
  options: Options,
  entryPoints: string[] = []
) {
  if (directory.layout) {
    parent = {
      ...directory.layout,
      children: [],
    };
    entryPoints.push(directory.layout.contextKey);
  }

  for (const routes of directory.views.values()) {
    const route = getMostSpecificRoute(routes);

    parent.children.push({
      ...route,
      entryPoints: [...entryPoints, route.contextKey],
    });
  }

  for (const child of directory.subdirectories.values()) {
    hoistDirectoryTree(child, parent, options, entryPoints);
  }
}

function getMostSpecificRoute(routes: RouteNode[]) {
  const route = routes[routes.length - 1];

  if (!routes[0]) {
    throw new Error(`${route.contextKey} does not contain a fallback platform route`);
  }

  return routes[routes.length - 1];
}

function getFileMeta(key: string) {
  const parts = key.split('/');
  const dirnameParts = parts.slice(0, -1);
  const dirname = dirnameParts.join('/');
  const filename = parts[parts.length - 1];
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

  return {
    key,
    specificity: 0,
    parts,
    dirnameParts,
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
