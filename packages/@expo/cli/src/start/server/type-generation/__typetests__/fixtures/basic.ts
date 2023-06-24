/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/ban-types */

  import type { LinkProps as OriginalLinkProps } from "expo-router/build/link/Link";
  export * from "expo-router/build";

  type StaticRoutes = `/apple` | `/banana`
  type DynamicRoutes<T extends string> = `/colors/${SingleRoutePart<T>}` | `/animals/${CatchAllRoutePart<T>}` | `/mix/${SingleRoutePart<T>}/${SingleRoutePart<T>}/${CatchAllRoutePart<T>}`
  type DynamicRouteTemplate = `/colors/[color]` | `/animals/[...animal]` | `/mix/[fruit]/[color]/[...animals]` 

  type RelativePathString = `./${string}` | `../${string}` | '..';
  type AbsoluteRoute = DynamicRouteTemplate | StaticRoutes;
  type ExternalPathString = `http${string}`
  type ExpoRouterRoutes = DynamicRouteTemplate | StaticRoutes | RelativePathString
  type AllRoutes = ExpoRouterRoutes | ExternalPathString

  /****************
   * Route Utils  *
   ****************/

  type SearchOrHash = `?${string}` | `#${string}`;
  type Suffix = "" | SearchOrHash;

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
  type SingleRoutePart<S extends string> = S extends `${string}/${string}`
      ? never
      : S extends ""
      ? never
      : S;

  /**
   * Return only the CatchAll slug of a string. If the string has search parameters or a hash return never
   */
  type CatchAllRoutePart<S extends string> = S extends '' ? never : S;

  type InvalidPartialSlug = `${string | never}${'[' | ']'}${string | never}`;

  /**
   * Return the name of a route parameter
   * '[test]'    -> 'test'
   * 'test'      -> never
   * '[...test]' -> '...test'
   */
  type IsParameter<Part> = Part extends `[${infer ParamName}]`
    ? ParamName
    : never;

  /**
   * Return a union of all parameter names. If there are no names return never
   *
   * /[test]         -> 'test'
   * /[abc]/[...def] -> 'abc'|'...def'
   */
  type ParameterNames<Path> =
    Path extends `${infer PartA}/${infer PartB}`
      ? IsParameter<PartA> | ParameterNames<PartB>
      : IsParameter<Path>;

  /**
   * Returns all segements of a route.
   *
   * /(group)/123/abc/[id]/[...rest] -> ['(group)', '123', 'abc', '[id]', '[...rest]'
   */
  type RouteSegments<Path> = Path extends `${infer PartA}/${infer PartB}`
    ? PartA extends "" | '.'
      ? [...RouteSegments<PartB>]
      : [PartA, ...RouteSegments<PartB>]
    : Path extends ""
    ? []
    : [Path];

  /**
   * Returns a Record of the routes parameters as strings and CatchAll parameters as string[]
   *
   * /[id]/[...rest] -> { id: string, rest: string[] }
   * /no-params      -> {}
   */
  type RouteParams<Path> = {
    [Key in ParameterNames<Path> as Key extends `...${infer Name}`
      ? Name
      : Key]: Key extends `...${string}` ? string[] : string;
  };

  /**
   * Returns the search parameters for a route
   */
  export type SearchParams<T extends AllRoutes> = T extends DynamicRouteTemplate
    ? RouteParams<T>
    : T extends StaticRoutes
      ? never
      : Record<string, string>;

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
  export type Route<T> = T extends DynamicRouteTemplate
    ? never
    :
        | `${StaticRoutes}${Suffix}`
        | RelativePathString
        | ExternalPathString
        | (T extends `${DynamicRoutes<infer _>}${Suffix}` ? T : never);

  /*********
   * Href  *
   *********/

  export type Href<T extends string> = Route<T> | HrefObject<T>;

  export type HrefObject<T = AllRoutes> = 
    T extends DynamicRouteTemplate
      ? { pathname: T, params: RouteParams<T> }
      : T extends Route<T>
        ? { pathname: Route<T>, params?: never }
        : never

  /***********************
   * Expo Router Exports *
   ***********************/

  export type Router = {
    /** Navigate to the provided href. */
    push: <T extends string>(href: Href<T>) => void;
    /** Navigate to route without appending to the history. */
    replace: <T extends string>(href: Href<T>) => void;
    /** Go back in the history. */
    back: () => void;
    /** Update the current route query params. */
    setParams: <T extends string = ''>(params?: T extends '' ? Record<string, string> : RouteParams<T>) => void;
  };

  /************
   * <Link /> *
   ************/
  export interface LinkProps<T extends string> extends OriginalLinkProps {
    href: T extends DynamicRouteTemplate ? HrefObject<T> : Href<T>;
  }

  export interface LinkComponent {
    <T extends string>(props: React.PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: <T extends string>(href: Href<T>) => string;
  }

  export declare const Link: LinkComponent;

  /************
   * Hooks *
   ************/
  export declare function useRouter(): Router
  export declare function useLocalSearchParams<T extends DynamicRouteTemplate | StaticRoutes | RelativePathString>(): SearchParams<T>
  export declare function useSearchParams<
    T extends AllRoutes | SearchParams<DynamicRouteTemplate> 
  >(): T extends AllRoutes ? SearchParams<T> : T;

  export declare function useGlobalSearchParams<
    T extends AllRoutes | SearchParams<DynamicRouteTemplate>
  >(): T extends AllRoutes ? SearchParams<T> : T;

  export declare function useSegments<
    T extends AbsoluteRoute | RouteSegments<AbsoluteRoute> | RelativePathString
  >(): T extends AbsoluteRoute
    ? RouteSegments<T>
    : T extends string
    ? string[]
    : T;
