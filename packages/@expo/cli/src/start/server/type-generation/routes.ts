import fs from 'fs/promises';
import debounce from 'lodash.debounce';
import { Server } from 'metro';
import path from 'path';

import { directoryExistsAsync } from '../../../utils/dir';
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

export async function setupTypedRoutes({
  server,
  metro,
  typesDirectory,
  projectRoot,
  routerDirectory,
}: SetupTypedRoutesOptions) {
  const { filePathToRoute, staticRoutes, dynamicRoutes, addFilePath, isRouteFile } =
    getTypedRoutesUtils(routerDirectory);

  if (metro && server) {
    // Setup out watcher first
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

    /**
     * If the user has a version of expo-router with included types, we can use the types from the package
     * Otherwise we default back to the CLI types
     */
    let expoRouterTypes;
    try {
      const expoRouterIncludedTypes = require.resolve('expo-router/types/expo-router.d.ts');
      expoRouterTypes = await fs.readFile(expoRouterIncludedTypes, 'utf-8');
    } catch {
      expoRouterTypes = template;
    }
    // If the user has expo-router v3+ installed, we can use the types from the package
    expoRouterTypes = expoRouterTypes
      // Swap from being a namespace to a module
      .replace('declare namespace ExpoRouter {', `declare module "expo-router" {`)
      // Add the route values
      .replace(
        'type StaticRoutes = string;',
        `type StaticRoutes = ${setToUnionType(staticRoutes)};`
      )
      .replace(
        'type DynamicRoutes<T extends string> = string;',
        `type DynamicRoutes<T extends string> = ${setToUnionType(dynamicRoutes)};`
      )
      .replace(
        'type DynamicRouteTemplate = never;',
        `type DynamicRouteTemplate = ${setToUnionType(dynamicRouteTemplates)};`
      );

    await fs.writeFile(path.resolve(typesDir, './router.d.ts'), expoRouterTypes);
  },
  100
);

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
      // Normalize the paths so they are easier to convert to URLs
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
const template = `/* eslint-disable  */
declare module "expo-router" {
  import type { ReactNode } from 'react';
  import type { TextProps } from 'react-native';

  import type { LinkProps as OriginalLinkProps } from 'expo-router/build/link/Link';
  import type { Router as OriginalRouter } from 'expo-router/build/types';
  export * from 'expo-router/build';


  export type StaticRoutes = string;
  export type DynamicRoutes<T extends string> = string;
  export type DynamicRouteTemplate = never;
  export type ExpoRouterRoutes = DynamicRouteTemplate | StaticRoutes | RelativePathString;
  export type AllRoutes = ExpoRouterRoutes | ExternalPathString;

  /****************
   * Route Utils  *
   ****************/
  type SearchOrHash = \`?\${string}\` | \`#\${string}\`;S
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
   * Returns all segments of a route.
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

  export type Href<T = string> = T extends object ? HrefObject<T> : Route<T>;

  export type HrefObject<R extends object, P = R['pathname']> = P extends DynamicRouteTemplate
    ? { pathname: P; params: InputRouteParams<P> }
    : P extends Route<P>
    ? {
        pathname: Route<P> | DynamicRouteTemplate;
        params?: never | InputRouteParams<P>;
      }
    : { pathname: DynamicRouteTemplate };

  /***********************
   * Expo Router Exports *
   ***********************/

  export type Router = {
    /** Go back in the history. */
    back: () => void;
    /** If there's history that supports invoking the \`back\` function. */
    canGoBack: () => boolean;
    /** Navigate to the provided href. */
    push: <T>(href: Href<T>) => void;
    /** Navigate to route without appending to the history. */
    replace: <T>(href: Href<T>) => void;
    /** Update the current route query params. */
    setParams: <T = ''>(
      params?: T extends '' ? Record<string, string> : InputRouteParams<T>
    ) => void;
  };

  /** The imperative router. */
  export const router: Router;

  /************
   * <Link /> *
   ************/
  export interface WebAnchorProps {
    /**
     * **Web only:** Specifies where to open the \`href\`.
     *
     * - **_self**: the current tab.
     * - **_blank**: opens in a new tab or window.
     * - **_parent**: opens in the parent browsing context. If no parent, defaults to **_self**.
     * - **_top**: opens in the highest browsing context ancestor. If no ancestors, defaults to **_self**.
     *
     * This property is passed to the underlying anchor (\`<a>\`) tag.
     *
     * @default '_self'
     *
     * @example
     * <Link href="https://expo.dev" target="_blank">Go to Expo in new tab</Link>
     */
    target?: '_self' | '_blank' | '_parent' | '_top' | (string & object);

    /**
     * **Web only:** Specifies the relationship between the \`href\` and the current route.
     *
     * Common values:
     * - **nofollow**: Indicates to search engines that they should not follow the \`href\`. This is often used for user-generated content or links that should not influence search engine rankings.
     * - **noopener**: Suggests that the \`href\` should not have access to the opening window's \`window.opener\` object, which is a security measure to prevent potentially harmful behavior in cases of links that open new tabs or windows.
     * - **noreferrer**: Requests that the browser not send the \`Referer\` HTTP header when navigating to the \`href\`. This can enhance user privacy.
     *
     * The \`rel\` property is primarily used for informational and instructive purposes, helping browsers and web
     * crawlers make better decisions about how to handle and interpret the links on a web page. It is important
     * to use appropriate \`rel\` values to ensure that links behave as intended and adhere to best practices for web
     * development and SEO (Search Engine Optimization).
     *
     * This property is passed to the underlying anchor (\`<a>\`) tag.
     *
     * @example
     * <Link href="https://expo.dev" rel="nofollow">Go to Expo</Link>
     */
    rel?: string;

    /**
     * **Web only:** Specifies that the \`href\` should be downloaded when the user clicks on the link,
     * instead of navigating to it. It is typically used for links that point to files that the user should download,
     * such as PDFs, images, documents, etc.
     *
     * The value of the \`download\` property, which represents the filename for the downloaded file.
     * This property is passed to the underlying anchor (\`<a>\`) tag.
     *
     * @example
     * <Link href="/image.jpg" download="my-image.jpg">Download image</Link>
     */
    download?: string;
  }

  export interface LinkProps extends Omit<TextProps, 'href'>, WebAnchorProps {
    /** Path to route to. */
    href: Href<T>;

    // TODO(EvanBacon): This may need to be extracted for React Native style support.
    /** Forward props to child component. Useful for custom buttons. */
    asChild?: boolean;

    /** Should replace the current route without adding to the history. */
    replace?: boolean;

    /** On web, this sets the HTML \`class\` directly. On native, this can be used with CSS interop tools like Nativewind. */
    className?: string;

    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
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
  export const Redirect: <T>(props: React.PropsWithChildren<{ href: Href<T> }>) => ReactNode;
  type Redirect = typeof Redirect;

  /**
   * Hooks
   */

  export function useRouter(): Router;
  type useRouter = typeof useRouter;

  /**
   * Returns the URL search parameters for the contextually focused route. e.g. \`/acme?foo=bar\` -> \`{ foo: "bar" }\`.
   * This is useful for stacks where you may push a new screen that changes the query parameters.
   *
   * To observe updates even when the invoking route is not focused, use \`useGlobalSearchParams()\`.
   * @see \`useGlobalSearchParams\`
   */
  export function useLocalSearchParams<
    TParams extends AllRoutes | UnknownOutputParams = UnknownOutputParams,
  >(): TParams extends AllRoutes ? SearchParams<TParams> : TParams;
  type useLocalSearchParams = typeof useLocalSearchParams;

  /**
   * Get the globally selected query parameters, including dynamic path segments. This function will update even when the route is not focused.
   * Useful for analytics or other background operations that don't draw to the screen.
   *
   * When querying search params in a stack, opt-towards using \`useLocalSearchParams\` as these will only
   * update when the route is focused.
   *
   * @see \`useLocalSearchParams\`
   */
  export function useGlobalSearchParams<
    T extends AllRoutes | UnknownOutputParams = UnknownOutputParams,
  >(): T extends AllRoutes ? SearchParams<T> : T;
  type useGlobalSearchParams = typeof useGlobalSearchParams;

  /** @deprecated renamed to \`useGlobalSearchParams\` */
  export function useSearchParams<
    T extends AllRoutes | UnknownOutputParams = UnknownOutputParams,
  >(): T extends AllRoutes ? SearchParams<T> : T;
  type useSearchParams = typeof useSearchParams;

  /**
   * Get a list of selected file segments for the currently selected route. Segments are not normalized, so they will be the same as the file path. e.g. /[id]?id=normal -> ["[id]"]
   *
   * \`useSegments\` can be typed using an abstract.
   * Consider the following file structure, and strictly typed \`useSegments\` function:
   *
   * \`\`\`md
   * - app
   *   - [user]
   *     - index.js
   *     - followers.js
   *   - settings.js
   * \`\`\`
   * This can be strictly typed using the following abstract:
   *
   * \`\`\`ts
   * const [first, second] = useSegments<['settings'] | ['[user]'] | ['[user]', 'followers']>()
   * \`\`\`
   */
  export function useSegments<
    T extends AbsoluteRoute | RouteSegments<AbsoluteRoute> | RelativePathString,
  >(): T extends AbsoluteRoute ? RouteSegments<T> : T extends string ? string[] : T;
  type useSegments = typeof useSegments;
}`;
