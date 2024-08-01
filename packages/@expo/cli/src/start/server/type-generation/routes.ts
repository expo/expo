import fs from 'fs/promises';
import debounce from 'lodash.debounce';
import { Server } from 'metro';
import path from 'path';
import resolveFrom from 'resolve-from';

import { directoryExistsAsync } from '../../../utils/dir';
import { unsafeTemplate } from '../../../utils/template';
import { ServerLike } from '../BundlerDevServer';
import { metroWatchTypeScriptFiles } from '../metro/metroWatchTypeScriptFiles';

// /test/[...param1]/[param2]/[param3] - captures ["param1", "param2", "param3"]
export const CAPTURE_DYNAMIC_PARAMS = /\[(?:\.{3})?(\w*?)[\]$]/g;
// /[...param1]/ - Match [...param1]
export const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
export const SLUG = /\[.+?\]/g;
// /(group1,group2,group3)/test - match (group1,group2,group3)
export const ARRAY_GROUP_REGEX = /\(\s*\w[\w\s]*?,.*?\)/g;
// /(group1,group2,group3)/test - captures ["group1", "group2", "group3"]
export const CAPTURE_GROUP_REGEX = /[\\(,]\s*(\w[\w\s]*?)\s*(?=[,\\)])/g;
/**
 * Match:
 *  - _layout files, +html, +not-found, string+api, etc
 *  - Routes can still use `+`, but it cannot be in the last segment.
 */
export const TYPED_ROUTES_EXCLUSION_REGEX = /(_layout|[^/]*?\+[^/]*?)\.[tj]sx?$/;

export interface SetupTypedRoutesOptions {
  server?: ServerLike;
  metro?: Server | null;
  typesDirectory: string;
  projectRoot: string;
  /** Absolute expo router routes directory. */
  routerDirectory: string;
}

export async function setupTypedRoutes(options: SetupTypedRoutesOptions) {
  const typedRoutesModule = resolveFrom.silent(
    options.projectRoot,
    'expo-router/build/typed-routes'
  );
  return typedRoutesModule ? typedRoutes(typedRoutesModule, options) : legacyTypedRoutes(options);
}

async function typedRoutes(
  typedRoutesModulePath: any,
  { server, metro, typesDirectory, projectRoot, routerDirectory }: SetupTypedRoutesOptions
) {
  /**
   * Expo Router uses EXPO_ROUTER_APP_ROOT in multiple places to determine the root of the project.
   * In apps compiled by Metro, this code is compiled away. But Typed Routes run in NodeJS with no compilation
   * so we need to explicitly set it.
   */
  process.env.EXPO_ROUTER_APP_ROOT = routerDirectory;

  const typedRoutesModule = require(typedRoutesModulePath);

  /**
   * Typed Routes can be run with out Metro or a Server, e.g. `expo customize tsconfig.json`
   */
  if (metro && server) {
    // Setup out watcher first
    metroWatchTypeScriptFiles({
      projectRoot,
      server,
      metro,
      eventTypes: ['add', 'delete', 'change'],
      callback: typedRoutesModule.getWatchHandler(typesDirectory),
    });
  }

  typedRoutesModule.regenerateDeclarations(typesDirectory);
}

async function legacyTypedRoutes({
  server,
  metro,
  typesDirectory,
  projectRoot,
  routerDirectory,
}: SetupTypedRoutesOptions) {
  const { filePathToRoute, staticRoutes, dynamicRoutes, addFilePath, isRouteFile } =
    getTypedRoutesUtils(routerDirectory);

  // Typed Routes can be run with out Metro or a Server, e.g. `expo customize tsconfig.json`
  if (metro && server) {
    metroWatchTypeScriptFiles({
      projectRoot,
      server,
      metro,
      eventTypes: ['add', 'delete', 'change'],
      async callback({ filePath, type }) {
        if (!isRouteFile(filePath)) {
          return;
        }

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
  }

  if (await directoryExistsAsync(routerDirectory)) {
    // Do we need to walk the entire tree on startup?
    // Idea: Store the list of files in the last write, then simply check Git for what files have changed
    await walk(routerDirectory, addFilePath);
  }

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
  async (
    typesDir: string,
    staticRoutes: Set<string>,
    dynamicRoutes: Set<string>,
    dynamicRouteTemplates: Set<string>
  ) => {
    await fs.mkdir(typesDir, { recursive: true });
    await fs.writeFile(
      path.resolve(typesDir, './router.d.ts'),
      getTemplateString(staticRoutes, dynamicRoutes, dynamicRouteTemplates)
    );
  },
  100
);

/*
 * This is exported for testing purposes
 */
export function getTemplateString(
  staticRoutes: Set<string>,
  dynamicRoutes: Set<string>,
  dynamicRouteTemplates: Set<string>
) {
  return routerDotTSTemplate({
    staticRoutes: setToUnionType(staticRoutes),
    dynamicRoutes: setToUnionType(dynamicRoutes),
    dynamicRouteParams: setToUnionType(dynamicRouteTemplates),
  });
}

/**
 * Utility functions for typed routes
 *
 * These are extracted for easier testing
 */
export function getTypedRoutesUtils(appRoot: string, filePathSeperator = path.sep) {
  /*
   * staticRoutes are a map where the key if the route without groups and the value
   *   is another set of all group versions of the route. e.g,
   *    Map([
   *      ["/", ["/(app)/(notes)", "/(app)/(profile)"]
   *    ])
   */
  const staticRoutes = new Map<string, Set<string>>([['/', new Set('/')]]);
  /*
   * dynamicRoutes are the same as staticRoutes (key if the resolved route,
   *   and the value is a set of possible routes). e.g:
   *
   * /[...fruits] -> /${CatchAllRoutePart<T>}
   * /color/[color] -> /color/${SingleRoutePart<T>}
   *
   * The keys of this map are also important, as they can be used as "static" types
   * <Link href={{ pathname: "/[...fruits]",params: { fruits: ["apple"] } }} />
   */
  const dynamicRoutes = new Map<string, Set<string>>();

  function normalizedFilePath(filePath: string) {
    return filePath.replaceAll(filePathSeperator, '/');
  }

  const normalizedAppRoot = normalizedFilePath(appRoot);

  const filePathToRoute = (filePath: string) => {
    return normalizedFilePath(filePath)
      .replace(normalizedAppRoot, '')
      .replace(/index\.[jt]sx?/, '')
      .replace(/\.[jt]sx?$/, '');
  };

  const isRouteFile = (filePath: string) => {
    if (filePath.match(TYPED_ROUTES_EXCLUSION_REGEX)) {
      return false;
    }

    // Route files must be nested with in the appRoot
    const relative = path.relative(appRoot, filePath);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  };

  const addFilePath = (filePath: string): boolean => {
    if (!isRouteFile(filePath)) {
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
          route
            .replaceAll(CATCH_ALL, '${CatchAllRoutePart<T>}')
            .replaceAll(SLUG, '${SingleRoutePart<T>}')
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

    if (!route.match(ARRAY_GROUP_REGEX)) {
      addRoute(route, route);
    }

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
    isRouteFile,
  };
}

export const setToUnionType = <T>(set: Set<T>) => {
  return set.size > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';
};

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
      const normalizedPath = p.replaceAll(path.sep, '/');
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
    extrapolateGroupRoutes(route.replace(groupsMatch, `(${group[1].trim()})`), routes);
  }

  return routes;
}

/**
 * NOTE: This code refers to a specific version of `expo-router` and is therefore unsafe to
 * mix with arbitrary versions.
 * TODO: Version this code with `expo-router` or version expo-router with `@expo/cli`.
 */
const routerDotTSTemplate = unsafeTemplate`/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/ban-types */
declare module "expo-router" {
  import type { LinkProps as OriginalLinkProps } from 'expo-router/build/link/Link';
  import type { Router as OriginalRouter } from 'expo-router/build/types';
  export * from 'expo-router/build';

  // prettier-ignore
  type StaticRoutes = ${'staticRoutes'};
  // prettier-ignore
  type DynamicRoutes<T extends string> = ${'dynamicRoutes'};
  // prettier-ignore
  type DynamicRouteTemplate = ${'dynamicRouteParams'};

  type RelativePathString = \`./\${string}\` | \`../\${string}\` | '..';
  type AbsoluteRoute = DynamicRouteTemplate | StaticRoutes;
  type ExternalPathString = \`\${string}:\${string}\`;

  type ExpoRouterRoutes = DynamicRouteTemplate | StaticRoutes | RelativePathString;
  export type AllRoutes = ExpoRouterRoutes | ExternalPathString;

  /****************
   * Route Utils  *
   ****************/

  type SearchOrHash = \`?\${string}\` | \`#\${string}\`;
  type UnknownInputParams = Record<string, string | number | (string | number)[]>;
  type UnknownOutputParams = Record<string, string | string[]>;

  /**
   * Return only the RoutePart of a string. If the string has multiple parts return never
   *
   * string   | type
   * ---------|------
   * 123      | 123
   * /123/abc | never
   * 123?abc  | never
   * ./123    | never
   * /123     | never
   * 123/../  | never
   */
  type SingleRoutePart<S extends string> = S extends \`\${string}/\${string}\`
    ? never
    : S extends \`\${string}\${SearchOrHash}\`
      ? never
      : S extends ''
        ? never
        : S extends \`(\${string})\`
          ? never
          : S extends \`[\${string}]\`
            ? never
            : S;

  /**
   * Return only the CatchAll router part. If the string has search parameters or a hash return never
   */
  type CatchAllRoutePart<S extends string> = S extends \`\${string}\${SearchOrHash}\`
    ? never
    : S extends ''
      ? never
      : S extends \`\${string}(\${string})\${string}\`
        ? never
        : S extends \`\${string}[\${string}]\${string}\`
          ? never
          : S;

  // type OptionalCatchAllRoutePart<S extends string> = S extends \`\${string}\${SearchOrHash}\` ? never : S

  /**
   * Return the name of a route parameter
   * '[test]'    -> 'test'
   * 'test'      -> never
   * '[...test]' -> '...test'
   */
  type IsParameter<Part> = Part extends \`[\${infer ParamName}]\` ? ParamName : never;

  /**
   * Return a union of all parameter names. If there are no names return never
   *
   * /[test]         -> 'test'
   * /[abc]/[...def] -> 'abc'|'...def'
   */
  type ParameterNames<Path> = Path extends \`\${infer PartA}/\${infer PartB}\`
    ? IsParameter<PartA> | ParameterNames<PartB>
    : IsParameter<Path>;

  /**
   * Returns all segements of a route.
   *
   * /(group)/123/abc/[id]/[...rest] -> ['(group)', '123', 'abc', '[id]', '[...rest]'
   */
  type RouteSegments<Path> = Path extends \`\${infer PartA}/\${infer PartB}\`
    ? PartA extends '' | '.'
      ? [...RouteSegments<PartB>]
      : [PartA, ...RouteSegments<PartB>]
    : Path extends ''
      ? []
      : [Path];

  /**
   * Returns a Record of the routes parameters as strings and CatchAll parameters
   *
   * There are two versions, input and output, as you can input 'string | number' but
   *  the output will always be 'string'
   *
   * /[id]/[...rest] -> { id: string, rest: string[] }
   * /no-params      -> {}
   */
  type InputRouteParams<Path> = {
    [Key in ParameterNames<Path> as Key extends \`...\${infer Name}\`
      ? Name
      : Key]: Key extends \`...\${string}\` ? (string | number)[] : string | number;
  } & UnknownInputParams;

  type OutputRouteParams<Path> = {
    [Key in ParameterNames<Path> as Key extends \`...\${infer Name}\`
      ? Name
      : Key]: Key extends \`...\${string}\` ? string[] : string;
  } & UnknownOutputParams;

  /**
   * Returns the search parameters for a route.
   */
  export type SearchParams<T extends AllRoutes> = T extends DynamicRouteTemplate
    ? OutputRouteParams<T>
    : T extends StaticRoutes
      ? never
      : UnknownOutputParams;

  /**
   * Route is mostly used as part of Href to ensure that a valid route is provided
   *
   * Given a dynamic route, this will return never. This is helpful for conditional logic
   *
   * /test         -> /test, /test2, etc
   * /test/[abc]   -> never
   * /test/resolve -> /test, /test2, etc
   *
   * Note that if we provide a value for [abc] then the route is allowed
   *
   * This is named Route to prevent confusion, as users they will often see it in tooltips
   */
  export type Route<T> = T extends string
    ? T extends DynamicRouteTemplate
      ? never
      :
          | StaticRoutes
          | RelativePathString
          | ExternalPathString
          | (T extends \`\${infer P}\${SearchOrHash}\`
              ? P extends DynamicRoutes<infer _>
                ? T
                : never
              : T extends DynamicRoutes<infer _>
                ? T
                : never)
    : never;

  /*********
   * Href  *
   *********/

  export type Href<T> = T extends Record<'pathname', string> ? HrefObject<T> : Route<T>;

  export type HrefObject<
    R extends Record<'pathname', string>,
    P = R['pathname'],
  > = P extends DynamicRouteTemplate
    ? { pathname: P; params: InputRouteParams<P> }
    : P extends Route<P>
      ? { pathname: Route<P> | DynamicRouteTemplate; params?: never | InputRouteParams<never> }
      : never;

  /***********************
   * Expo Router Exports *
   ***********************/

  export type Router = Omit<OriginalRouter, 'push' | 'replace' | 'setParams'> & {
    /** Navigate to the provided href. */
    push: <T>(href: Href<T>) => void;
    /** Navigate to route without appending to the history. */
    replace: <T>(href: Href<T>) => void;
    /** Update the current route query params. */
    setParams: <T = ''>(params?: T extends '' ? Record<string, string> : InputRouteParams<T>) => void;
  };

  /** The imperative router. */
  export const router: Router;

  /************
   * <Link /> *
   ************/
  export interface LinkProps<T> extends OriginalLinkProps {
    href: Href<T>;
  }

  export interface LinkComponent {
    <T>(props: React.PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: <T>(href: Href<T>) => string;
  }

  /**
   * Component to render link to another route using a path.
   * Uses an anchor tag on the web.
   *
   * @param props.href Absolute path to route (e.g. \`/feeds/hot\`).
   * @param props.replace Should replace the current route without adding to the history.
   * @param props.asChild Forward props to child component. Useful for custom buttons.
   * @param props.children Child elements to render the content.
   * @param props.className On web, this sets the HTML \`class\` directly. On native, this can be used with CSS interop tools like Nativewind.
   */
  export const Link: LinkComponent;

  /** Redirects to the href as soon as the component is mounted. */
  export const Redirect: <T>(
    props: React.PropsWithChildren<{ href: Href<T> }>
  ) => JSX.Element;

  /************
   * Hooks *
   ************/
  export function useRouter(): Router;

  export function useLocalSearchParams<
    T extends AllRoutes | UnknownOutputParams = UnknownOutputParams,
  >(): T extends AllRoutes ? SearchParams<T> : T;

  /** @deprecated renamed to \`useGlobalSearchParams\` */
  export function useSearchParams<
    T extends AllRoutes | UnknownOutputParams = UnknownOutputParams,
  >(): T extends AllRoutes ? SearchParams<T> : T;

  export function useGlobalSearchParams<
    T extends AllRoutes | UnknownOutputParams = UnknownOutputParams,
  >(): T extends AllRoutes ? SearchParams<T> : T;

  export function useSegments<
    T extends AbsoluteRoute | RouteSegments<AbsoluteRoute> | RelativePathString,
  >(): T extends AbsoluteRoute ? RouteSegments<T> : T extends string ? string[] : T;
}
`;
