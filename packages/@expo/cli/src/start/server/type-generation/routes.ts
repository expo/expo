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
  const appRoot = path.resolve(env.EXPO_ROUTER_APP_ROOT);

  const staticRoutes = new Set<string>();
  const dynamicRoutes = new Set<string>();
  const dynamicRouteTemplates = new Set<string>();

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
      dynamicRouteTemplates.add(route);

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
        dynamicRouteTemplates.add(routeWithoutGroups);

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
      for (const routeWithSingleGroup of expandGroupRoutes(route)) {
        if (isDynamic) {
          dynamicRouteTemplates.add(routeWithSingleGroup);

          dynamicRoutes.add(
            routeWithSingleGroup
              .replaceAll(CATCH_ALL, '${CatchAllSlug<T>}')
              .replaceAll(SLUG, '${SafeSlug<T>}')
          );
        } else {
          staticRoutes.add(routeWithSingleGroup);
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
      regenerateRouterDotTS(typesDirectory, staticRoutes, dynamicRoutes, dynamicRouteTemplates);
    }
  );

  // Do we need to walk the entire tree on startup?
  // Idea: Store the list of files in the last write, then simply check Git for what files have changed
  await walk(appRoot, addFilePath);

  regenerateRouterDotTS(typesDirectory, staticRoutes, dynamicRoutes, dynamicRouteTemplates);
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
        staticRoutes: setToType(staticRoutes),
        dynamicRoutes: setToType(dynamicRoutes),
        dynamicRouteParams: setToType(dynamicRouteTemplates),
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
    : T extends { pathname: DynamicRouteTemplate & infer I }
    ? { params: RouteParams<I> }
    : unknown;

  export interface LinkProps<T> extends OriginalLinkProps {
    href: T extends DynamicRouteTemplate ? HrefObject<T> : Href<T>;
  }

  export interface LinkComponent {
    <T>(props: React.PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: <T>(href: Href<T>) => string;
  }

  export const Link: LinkComponent;

  export type Router<T> = {
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
