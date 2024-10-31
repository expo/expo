/**
 * @hidden
 */
type HasTypedRoutes = ExpoRouter.__routes extends { StaticRoutes: string } ? true : false;

/**
 * @hidden
 */
export type StaticRoutes = ExpoRouter.__routes extends { StaticRoutes: string }
  ? ExpoRouter.__routes['StaticRoutes']
  : string;

/**
 * @hidden
 */
export type DynamicRoutes<T extends string> =
  ExpoRouter.__routes<T> extends {
    DynamicRoutes: any;
  }
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      T extends ExpoRouter.__routes<infer _>['DynamicRoutes']
      ? T
      : never
    : string;

/**
 * @hidden
 */
export type DynamicRouteTemplate = ExpoRouter.__routes extends { DynamicRouteTemplate: string }
  ? ExpoRouter.__routes['DynamicRouteTemplate']
  : string;

/**
 * The main routing type for Expo Router.
 *
 * @internal
 * @hidden
 */
export namespace ExpoRouter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface __routes<T extends string = string> extends Record<string, unknown> {}
}

/**
 * @hidden
 */
export type Routes = DynamicRouteTemplate | AllUngroupedRoutes<StaticRoutes>;

/**
 * The main routing type for Expo Router. It includes all available routes with strongly
 * typed parameters. It can either be:
 * - **string**: A full path like `/profile/settings` or a relative path like `../settings`.
 * - **object**: An object with a `pathname` and optional `params`. The `pathname` can be
 * a full path like `/profile/settings` or a relative path like `../settings`.
 * The params can be an object of key-value pairs.
 *
 * It can also accept an optional `<T>` parameter to correctly type dynamic routes string.
 *
 * For example, without the generic the route `/folder/[slug]` will be typed as `/folder/${string}`,
 * which is incorrect as `/folder/apple/orange` would be valid. However, by passing desired
 * route as a generic `Href<'/folder/apple'>`, it will validate against this edge case.
 */
export type Href<T extends string | object = { __branded__: any }> = GeneratedHref<T>;

/**
 * @hidden
 */
type GeneratedHref<T extends string | object> =
  | StaticRouteToHrefString<
      AllUngroupedRoutes<StaticRoutes> | RelativePathString | ExternalPathString
    >
  | StaticRouteToHrefObject<
      AllUngroupedRoutes<StaticRoutes> | RelativePathString | ExternalPathString
    >
  | DynamicRouteString<T>
  | DynamicTemplateToHrefObject<DynamicRouteTemplate>;

/**
 * Converts a static route to a Href string type.
 */
type StaticRouteToHrefString<T extends string = string> = T | `${T}${SearchOrHash}`;

/**
 * Converts a static route to a Href object.
 */
type StaticRouteToHrefObject<T extends string = string> = T extends any
  ? {
      pathname: T;
      params?: RouteParamInput<T> | never;
    }
  : never;

/**
 * Converts a dynamic route template to a `Href` string type.
 */
type DynamicRouteString<
  T extends string | object,
  P = DynamicRouteTemplate,
> = '__branded__' extends keyof T
  ? DynamicTemplateToHrefString<P>
  : T extends string
    ? DynamicRoutes<T>
    : never;

/**
 * @hidden
 */
export type DynamicTemplateToHrefString<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? // If the current segment (PartA) is dynamic, allow any string. This loop again with the next segment (PartB)
    `${PartA extends `[${string}]` ? string : PartA}/${DynamicTemplateToHrefString<PartB>}`
  : // Path is the last segment.
    Path extends `[${string}]`
    ? string
    : Path;

/**
 * Converts a dynamic route object to a `Href` object.
 */
type DynamicTemplateToHrefObject<T extends string> = T extends string
  ? {
      pathname: T;
      params: RouteParamInput<T>;
    }
  : never;

/****************
 * Route Utils  *
 ****************/

type RelativePathString = `./${string}` | `../${string}` | '..';
type SearchOrHash = `?${string}` | `#${string}`;
type ExternalPathString = `${string}:${string}`;

/**
 * Given a route. Returns a union of both that route with and without the groups.
 *
 * The type is recursive and will provide a union of all possible routes.
 */
type AllUngroupedRoutes<Path> = Path extends `(${infer PartA})/${infer PartB}`
  ? `(${PartA})/${AllUngroupedRoutes<PartB>}` | AllUngroupedRoutes<PartB>
  : Path;

/**
 * Routes can have known inputs (e.g query params).
 * Unlike outputs, inputs can be `undefined` or `null`.
 *
 * @hidden
 */
export type UnknownInputParams = Record<
  string,
  string | number | undefined | null | (string | number)[]
>;

/**
 * Routes can have unknown outputs (e.g query params).
 * Unlike inputs, outputs can't be undefined or null.
 *
 * @hidden
 */
export type UnknownOutputParams = Record<string, string | string[]>;

/**
 * Return the name of a route parameter
 * @example
 * ```
 * '[test]'    -> 'test'
 * 'test'      -> never
 * '[...test]' -> '...test'
 * ```
 */
type IsParameter<Part> = Part extends `[${infer ParamName}]` ? ParamName : never;

/**
 * Return a union of all raw parameter names. If there are no names return never.
 *
 * This differs from ParameterNames as it returns the `...` for catch all parameters.
 * @example
 * ```
 * /[test]         -> 'test'
 * /[abc]/[...def] -> 'abc'|'...def'
 * ```
 */
type ParameterNames<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? PartA extends '.' // Skip relative paths
    ? ParameterNames<PartB>
    : IsParameter<PartA> | ParameterNames<PartB>
  : IsParameter<Path>;

/**
 * Return only the RoutePart of a string. If the string has multiple parts return never
 *
 * string   | type
 *| ---------|------|
 *| 123      | 123 |
 *| /123/abc | never |
 *| 123?abc  | never |
 *| ./123    | never |
 *| /123     | never |
 *| 123/../  | never |
 *
 * @hidden
 */
export type SingleRoutePart<S extends string> = S extends `${string}/${string}`
  ? never
  : S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
      ? never
      : S extends `(${string})`
        ? never
        : S extends `[${string}]`
          ? never
          : S;

/**
 * Returns a Record of the routes parameters as strings and CatchAll parameters
 *
 * There are two versions, input and output, as you can input 'string | number' but
 *  the output will always be 'string'
 *
 * @example
 * ```
 * /[id]/[...rest] -> { id: string, rest: string[] }
 * /no-params      -> {}
 * ```
 */
export type StrictRouteParamsInputs<Path> = {
  [Key in ParameterNames<Path> as Key extends `...${infer Name}`
    ? Name
    : Key]: Key extends `...${string}` ? (string | number)[] : string | number;
};

/**
 * Returns a Record of the routes parameters as strings and CatchAll parameters
 *
 * There are two versions, input and output, as you can input 'string | number' but
 *  the output will always be 'string'
 *
 * @see {@link StrictRouteParamsInputs} for the input version
 *
 * @example
 * ```
 * /[id]/[...rest] -> { id: string, rest: string[] }
 * /no-params      -> {}
 * ```
 */
export type StrictRouteParamsOutput<Path> = {
  [Key in ParameterNames<Path> as Key extends `...${infer Name}`
    ? Name
    : Key]: Key extends `...${string}` ? string[] : string;
};

/**
 * @hidden
 */
export type RouteParamInput<Path> = StrictRouteParamsInputs<Path> & UnknownInputParams;

/**
 * @hidden
 */
export type RouteParams<
  PathOrObject extends Routes | UnknownOutputParams,
  ExtraPathOrObject extends UnknownOutputParams = UnknownOutputParams,
> = PathOrObject extends string
  ? StrictRouteParamsOutput<PathOrObject> & ExtraPathOrObject
  : PathOrObject;

/**
 * @deprecated Use `RouteParams` or `StrictRouteParams` instead.
 *
 * @hidden
 */
export type SearchParams<T extends string = never> = RouteParams<T>;

/**
 * @hidden
 */
export type RouteSegments<PathOrStringArray extends string | string[]> =
  PathOrStringArray extends string[]
    ? PathOrStringArray
    : PathOrStringArray extends `/${infer PartA}`
      ? RouteSegments<PartA>
      : PathOrStringArray extends `${infer PartA}/${infer PartB}`
        ? [PartA, ...RouteSegments<PartB>]
        : HasTypedRoutes extends true
          ? [PathOrStringArray]
          : string[];
