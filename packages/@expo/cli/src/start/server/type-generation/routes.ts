import fs from 'fs/promises';
import { debounce } from 'lodash';
import { Server } from 'metro';
import path from 'path';

import { unsafeTemplate } from '../../../utils/template';
import { ServerLike } from '../BundlerDevServer';
import { metroWatchTypeScriptFiles } from '../metro/metroWatchTypeScriptFiles';
import { getExpoRouterRootDirectory } from '../metro/router';
import { setToUnionType } from './utils';

// /test/[...param1]/[param2]/[param3] - captures ["param1", "param2", "param3"]
export const CAPTURE_DYNAMIC_PARAMS = /\[(?:\.{3})?(\w*?)[\]$]/g;
// /[...param1]/ - Match [...param1]
export const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
export const SLUG = /\[.+?\]/g;
// /(group1,group2,group3)/test - match (group1,group2,group3)
export const ARRAY_GROUP_REGEX = /\(\w+?,.*?\)/g;
// /(group1,group2,group3)/test - captures ["group1", "group2", "group3"]
export const CAPTURE_GROUP_REGEX = /[\\(,](\w+?)(?=[,\\)])/g;

export interface SetupTypedRoutesOptions {
  server: ServerLike;
  metro: Server;
  typesDirectory: string;
  projectRoot: string;
}

export async function setupTypedRoutes({
  server,
  metro,
  typesDirectory,
  projectRoot,
}: SetupTypedRoutesOptions) {
  const appRoot = getExpoRouterRootDirectory(projectRoot);

  const { filePathToRoute, staticRoutes, dynamicRoutes, addFilePath } =
    getTypedRoutesUtils(appRoot);

  // Setup out watcher first
  metroWatchTypeScriptFiles({
    projectRoot: appRoot,
    server,
    metro,
    eventTypes: ['add', 'delete', 'change'],
    async callback({ filePath, type }) {
      let shouldRegenerate = false;
      if (type === 'delete') {
        const route = filePathToRoute(filePath);
        staticRoutes.delete(route);
        dynamicRoutes.delete(route);
        shouldRegenerate = true;
      } else {
        shouldRegenerate = addFilePath(filePath);
      }

      if (shouldRegenerate) {
        regenerateRouterDotTS(
          typesDirectory,
          new Set([...staticRoutes.values()].flatMap((v) => Array.from(v))),
          new Set([...dynamicRoutes.values()].flatMap((v) => Array.from(v))),
          new Set(dynamicRoutes.keys())
        );
      }
    },
  });

  // Do we need to walk the entire tree on startup?
  // Idea: Store the list of files in the last write, then simply check Git for what files have changed
  await walk(appRoot, addFilePath);

  regenerateRouterDotTS(
    typesDirectory,
    new Set([...staticRoutes.values()].flatMap((v) => Array.from(v))),
    new Set([...dynamicRoutes.values()].flatMap((v) => Array.from(v))),
    new Set(dynamicRoutes.keys())
  );
}

/**
 * Generate a router.d.ts file that contains all of the routes in the project.
 * Should be debounced as its very common for developers to make changes to multiple files at once (eg Save All)
 */
const regenerateRouterDotTS = debounce(
  (
    typesDir: string,
    staticRoutes: Set<string>,
    dynamicRoutes: Set<string>,
    dynamicRouteTemplates: Set<string>
  ) => {
    fs.writeFile(
      path.resolve(typesDir, './router.d.ts'),
      routerDotTSTemplate({
        staticRoutes: setToUnionType(staticRoutes),
        dynamicRoutes: setToUnionType(dynamicRoutes),
        dynamicRouteParams: setToUnionType(dynamicRouteTemplates),
      })
    );
  },
  100
);

/**
 * Utility functions for typed routes
 *
 * These are extracted for easier testing
 */
export function getTypedRoutesUtils(appRoot: string) {
  const staticRoutes = new Map<string, Set<string>>([['/', new Set('/')]]);
  const dynamicRoutes = new Map<string, Set<string>>();

  const filePathToRoute = (filePath: string) => {
    return filePath
      .replace(appRoot, '')
      .replace(/index.[jt]sx?/, '')
      .replace(/\.[jt]sx?$/, '');
  };

  const addFilePath = (filePath: string): boolean => {
    if (filePath.match(/_layout\.[tj]sx?$/)) {
      return false;
    }

    const route = filePathToRoute(filePath);

    // We have already processed this file
    if (staticRoutes.has(route) || dynamicRoutes.has(route)) {
      return false;
    }

    const dynamicParams = new Set(
      [...route.matchAll(CAPTURE_DYNAMIC_PARAMS)].map((match) => match[1])
    );
    const isDynamic = dynamicParams.size > 0;

    const addRoute = (originalRoute: string, route: string) => {
      if (isDynamic) {
        let set = dynamicRoutes.get(originalRoute);

        if (!set) {
          set = new Set();
          dynamicRoutes.set(originalRoute, set);
        }

        set.add(
          route.replaceAll(CATCH_ALL, '${CatchAllSlug<T>}').replaceAll(SLUG, '${SafeSlug<T>}')
        );
      } else {
        let set = staticRoutes.get(originalRoute);

        if (!set) {
          set = new Set();
          staticRoutes.set(originalRoute, set);
        }

        set.add(route);
      }
    };

    addRoute(route, route);

    // Does this route have a group? eg /(group)
    if (route.includes('/(')) {
      const routeWithoutGroups = route.replace(/\/\(.+?\)/g, '');
      addRoute(route, routeWithoutGroups);

      // If there are multiple groups, we need to expand them
      // eg /(test1,test2)/page => /test1/page & /test2/page
      for (const routeWithSingleGroup of extrapolateGroupRoutes(route)) {
        addRoute(route, routeWithSingleGroup);
      }
    }

    return true;
  };

  return {
    staticRoutes,
    dynamicRoutes,
    filePathToRoute,
    addFilePath,
  };
}

/**
 * Recursively walk a directory and call the callback with the file path.
 */
async function walk(directory: string, callback: (filePath: string) => void) {
  const files = await fs.readdir(directory);
  for (const file of files) {
    const p = path.join(directory, file);
    if ((await fs.stat(p)).isDirectory()) {
      await walk(p, callback);
    } else {
      // Normalise the paths so they are easier to convert to URLs
      const normalizedPath = p.replaceAll(path.sep, '/').replaceAll(' ', '_');
      callback(normalizedPath);
    }
  }
}

/**
 * Given a route, return all possible routes that could be generated from it.
 */
export function extrapolateGroupRoutes(
  route: string,
  routes: Set<string> = new Set()
): Set<string> {
  // Create a version with no groups. We will then need to cleanup double and/or trailing slashes
  routes.add(route.replaceAll(ARRAY_GROUP_REGEX, '').replaceAll(/\/+/g, '/').replace(/\/$/, ''));

  const match = route.match(ARRAY_GROUP_REGEX);

  if (!match) {
    routes.add(route);
    return routes;
  }

  const groupsMatch = match[0];

  for (const group of groupsMatch.matchAll(CAPTURE_GROUP_REGEX)) {
    extrapolateGroupRoutes(route.replace(groupsMatch, `(${group[1]})`), routes);
  }

  return routes;
}

/**
 * NOTE: This code refers to a specific version of `expo-router` and is therefore unsafe to
 * mix with arbitrary versions.
 * TODO: Version this code with `expo-router` or version expo-router with `@expo/cli`.
 */
const routerDotTSTemplate = unsafeTemplate`declare module "expo-router" {
  import type { LinkProps as OriginalLinkProps } from "expo-router/build/link/Link";
  export * from "expo-router/build";

  type StaticRoutes = ${'staticRoutes'}
  type DynamicRoutes<T extends string> = ${'dynamicRoutes'}
  type DynamicRouteTemplate = ${'dynamicRouteParams'} 

  type SearchOrHash = \`?\${string}\` | \`#\${string}\`;

  type RelativePathString = \`./\${string}\` | \`../\${string}\` | '..';

  type Suffix = "" | SearchOrHash;

  type SafeSlug<S extends string> = S extends \`\${string}/\${string}\`
    ? never
    : S extends \`\${string}\${SearchOrHash}\`
    ? never
    : S extends ""
    ? never
    : S;

  type CatchAllSlug<S extends string> = S extends \`\${string}\${SearchOrHash}\`
    ? never
    : S extends ""
    ? never
    : S;

  type InvaildPartialSlug = | \`\${string | never}\${'[' | ']'}\${string | never}\`

  type IsParameter<Part> = Part extends \`[\${infer ParamName}]\`
    ? ParamName
    : never;

  type FilteredParts<Path> = Path extends \`\${infer PartA}/\${infer PartB}\`
    ? IsParameter<PartA> | FilteredParts<PartB>
    : IsParameter<Path>;

  type RouteParams<Path> = {
    [Key in FilteredParts<Path> as Key extends \`...\${infer Name}\` ? Name : Key]: 
      Key extends \`...\${string}\` ? string[] : string;
  };

  type Route<T> = T extends DynamicRouteTemplate
    ? never
    :
        | StaticRoutes
        | RelativePathString
        | \`\${StaticRoutes}\${Suffix}\`
        | (T extends \`\${DynamicRoutes<infer P>}\${Suffix}\`
            ? P extends InvaildPartialSlug
              ? never
              : T
            : never);

  export type Href<T> = Route<T> | HrefObject<T> | DynamicRouteTemplate

  export type HrefObject<T> = {
    pathname: Route<T> | DynamicRouteTemplate
  } & HrefObjectParams<T>;

  type HrefObjectParams<T> = T extends RelativePathString
    ? { params?: Record<string, string> }
    : T extends { pathname: DynamicRouteTemplate }
    ? { params: RouteParams<InferPathName<T>> }
    : unknown;

  type InferPathName<T> = T extends { pathname: infer P } ? P : never;

  export interface LinkProps<T> extends OriginalLinkProps {
    href: T extends DynamicRouteTemplate ? HrefObject<T> : Href<T>;
  }

  export interface LinkComponent {
    <T>(props: React.PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: <T>(href: Href<T>) => string;
  }

  export const Link: LinkComponent;

  export type Router = {
    /** Navigate to the provided href. */
    push: <T>(href: Href<T>) => void;
    /** Navigate to route without appending to the history. */
    replace: <T>(href: Href<T>) => void;
    /** Go back in the history. */
    back: () => void;
    /** Update the current route query params. */
    setParams: <T extends string = ''>(params?: T extends '' ? Record<string, string> : RouteParams<T>) => void;
  };

  export function useRouter<T>(): Router<T>
}
`;
