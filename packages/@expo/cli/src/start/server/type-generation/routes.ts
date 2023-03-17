import fs from 'fs/promises';
import { debounce } from 'lodash';
import { Server } from 'metro';
import path from 'path';

import { env } from '../../../utils/env';
import { unsafeTemplate } from '../../../utils/template';
import { ServerLike } from '../BundlerDevServer';
import { metroWatchTypeScriptFiles } from '../metro/metroWatchTypeScriptFiles';

// /test/[...param1]/[param2]/[param3] - Will match ["param1", "param2", "param3"]
const CAPTURE_DYNAMIC_PARAMS = /\/\[(?:\.{3})?(\w*?)[\]$]/g;
// /[...param1]/ - Match [...param1]
const CATCH_ALL = /\[\.\.\..+?\]/g;
// /[param1] - Match [param1]
const SLUG = /\[.+?\]/g;

export interface SetupTypedRoutesOptions {
  server: ServerLike;
  metro: Server;
  typesDirectory: string;
}

export async function setupTypedRoutes({ server, metro, typesDirectory }: SetupTypedRoutesOptions) {
  const appRoot = env.EXPO_ROUTER_APP_ROOT;

  const staticRoutes = new Set<string>();
  const dynamicRoutes = new Set<string>();
  const routesParams = new Map<string, Set<string>>();

  const addFilePath = (filePath: string) => {
    if (filePath.includes('_layout')) {
      return;
    }

    // Remove the appDir prefix, extentions and index routes
    const route = filePath
      .replace(appRoot, '')
      .replace(/index.[jt]sx?/, '')
      .replace(/\.[jt]sx?$/, '');

    const dynamicParams = new Set(
      [...route.matchAll(CAPTURE_DYNAMIC_PARAMS)].map((match) => match[1])
    );
    const isDynamic = dynamicParams.size > 0;

    if (isDynamic) {
      routesParams.set(route, dynamicParams);

      dynamicRoutes.add(
        route.replaceAll(CATCH_ALL, '${CatchAllSlug<T>}').replaceAll(SLUG, '${SafeSlug<T>}')
      );
    } else {
      staticRoutes.add(route);
    }

    // Does this route have a group? eg /(group)
    if (route.includes('/(')) {
      const routeWithoutGroups = route.replace(/\/\(.+?\)/g, '');

      if (isDynamic) {
        routesParams.set(routeWithoutGroups, dynamicParams);

        dynamicRoutes.add(
          routeWithoutGroups
            .replaceAll(CATCH_ALL, '${CatchAllSlug<T>}')
            .replaceAll(SLUG, '${SafeSlug<T>}')
        );
      } else {
        staticRoutes.add(routeWithoutGroups);
      }

      // If there are multiple groups, we need to expand them
      // eg /(test1,test2)/page => /test1/page & /test2/page
      for (const groupRoute of expandGroupRoutes(route)) {
        if (isDynamic) {
          routesParams.set(groupRoute, dynamicParams);

          dynamicRoutes.add(
            groupRoute
              .replaceAll(CATCH_ALL, '${CatchAllSlug<T>}')
              .replaceAll(SLUG, '${SafeSlug<T>}')
          );
        } else {
          staticRoutes.add(groupRoute);
        }
      }
    }
  };

  // Setup out watcher first
  metroWatchTypeScriptFiles(
    appRoot,
    {
      server,
      metro,
    },
    async (filePath: string) => {
      if (staticRoutes.has(filePath) || staticRoutes.has(filePath)) {
        return;
      }

      addFilePath(filePath);
      regenerateRouterDotTS(typesDirectory, staticRoutes, dynamicRoutes, routesParams);
    }
  );

  // Do we need to walk the entire tree on startup?
  // Idea: Store the list of files in the last write, then simply check Git for what files have changed
  await walk(appRoot, addFilePath);

  regenerateRouterDotTS(typesDirectory, staticRoutes, dynamicRoutes, routesParams);
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
    routesParams: Map<string, Set<string>>
  ) => {
    // const dynamicRouteParams = [...routesParams]
    //   .map(([route, paramNames]) => {
    //     const params = [...paramNames].map((name) => `${name}: string`).join(';');
    //     return `[\`${route}\`, { ${params} }]`;
    //   })
    //   .join(' | ');

    fs.writeFile(
      path.resolve(typesDir, './router.d.ts'),
      routerDotTSTemplate({
        staticRoutes: setToType(staticRoutes),
        dynamicRoutes: setToType(dynamicRoutes),
        dynamicRouteParams: mapToType(routesParams),
      })
    );
  },
  100
);

/**
 * Convert a set to a string type.
 * @example setToType(new Set(['a', 'b'])) => 'a | b'
 * @example setToType() => 'never'
 */
const setToType = <T>(set: Set<T>) =>
  set.size > 0 ? [...set].map((s) => `\`${s}\``).join(' | ') : 'never';

/**
 * Convert a map to a Record type.
 * @example setToType(new Set(['a', 'b'])) => 'a | b'
 * @example setToType() => 'never'
 */
const mapToType = <K, V>(map: Map<K, Set<V>>) => {
  if (map.size === 0) return 'never';

  const inner = [...map]
    .map(([key, value]) => {
      return `    '${key}': ${setToType(value)}`;
    })
    .join(';\n');

  return `{\n${inner}\n  }`;
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
      const normalizedPath = p.replaceAll(path.sep, '/').replaceAll(' ', '_');
      callback(normalizedPath);
    }
  }
}

function expandGroupRoutes(route: string, routes: Set<string> = new Set()): Set<string> {
  const match = route.match(/\/\(\w+?,\w+?\)\//);

  routes.add(route.replace(/\/\(\w+?,\w+?\)/, ''));

  if (!match) {
    routes.add(route);
    return routes;
  }

  // Will be '/(test,test2)/' - Note the surrounding slashs
  const groupsMatch = match[0];
  const groups = groupsMatch.slice(2, groupsMatch.length - 2).split(',');

  for (const group of groups) {
    const groupRoute = route.replace(groupsMatch, `/(${group})/`);
    expandGroupRoutes(groupRoute, routes);
  }

  return routes;
}

const routerDotTSTemplate = unsafeTemplate`declare module "expo-router" {
  import type { LinkProps as OriginalLinkProps } from "expo-router/build/link/Link";
  export * from "expo-router/build";

  type SearchOrHash = \`?\${string}\` | \`#\${string}\`;


  type PathString = \`./\${string}\` | \`/\${string}\`;

  type Suffix = "" | SearchOrHash;

  type SafeSlug<S extends string> = S extends \`\${string}/\${string}\`
    ? never
    : S extends \`\${string}\${SearchOrHash}\`
    ? never
    : S extends ""
    ? never
    : S extends \`[\${string}]\`
    ? never
    : S;

  type CatchAllSlug<S extends string> = S extends \`\${string}\${SearchOrHash}\`
    ? never
    : S extends ""
    ? never
    : S extends \`[\${string}]\`
    ? never
    : S;

  type StaticRoutes = ${'staticRoutes'}
  type DynamicRoutes<T extends string> = ${'dynamicRoutes'}
  type DynamicRouteParams = ${'dynamicRouteParams'} 

  type Route<T> = T extends keyof DynamicRouteParams
    ? never
    : StaticRoutes
      | \`\${StaticRoutes}\${Suffix}\`
      | (T extends \`\${DynamicRoutes<infer _>}\${Suffix}\` ? T : never)

  export type Href<T extends string> = Route<T> | HrefObject<T>;

  export type HrefObject<T> = {
    pathname: Route<T> | keyof DynamicRouteParams;
  } & HrefObjectParams<T>;

  type HrefObjectParams<T> = T extends { pathname: infer I }
    ? I extends keyof DynamicRouteParams
      ? { params: Record<DynamicRouteParams[I], string> }
      : unknown
    : unknown;

  export interface LinkProps<T extends string = ""> extends OriginalLinkProps {
    href: Href<T>;
  }

  export interface LinkComponent {
    <T extends string>(props: React.PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: <T extends string>(href: Href<T>) => string;
  }

  export const Link: LinkComponent;

  export type Router<T extends string = never> = {
    /** Navigate to the provided href. */
    push: (href: Href<T>) => void;
    /** Navigate to route without appending to the history. */
    replace: (href: Href<T>) => void;
    /** Go back in the history. */
    back: () => void;
    /** Update the current route query params. */
    setParams: <T extends keyof DynamicRouteParams = keyof DynamicRouteParams>(params?: DynamicRouteParams[T]) => void;
  };

  export function useRouter<T extends string>(): Router<T>
}
`;
