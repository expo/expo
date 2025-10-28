export interface MiddlewareInfo {
  /**
   * Path to the module that contains the middleware function as a default export.
   *
   * @example _expo/functions/+middleware.js
   */
  file: string;
}

export interface RouteInfo<TRegex = RegExp | string> {
  file: string;
  page: string;
  /**
   * Regex for matching a path against the route.
   * The regex is normalized for named matchers so keys must be looked up against the `routeKeys` object to collect the original route param names.
   * Regex matching alone cannot accurately route to a file, the order in which routes are matched is equally important to ensure correct priority.
   */
  namedRegex: TRegex;
  /**
   * Keys are route param names that have been normalized for a regex named-matcher, values are the original route param names.
   */
  routeKeys: Record<string, string>;
  /** Indicates that the route was generated and does not map to any file in the project's routes directory. */
  generated?: boolean;
  /** Indicates that this is a redirect that should use 301 instead of 307 */
  permanent?: boolean;
  /** If a redirect, which methods are allowed. Undefined represents all methods */
  methods?: string[];
}

export interface RoutesManifest<TRegex = RegExp | string> {
  /**
   * Middleware function that runs before any route matching.
   * Only allowed at the root level and requires web.output: "server".
   */
  middleware?: MiddlewareInfo;
  /**
   * Headers to be applied to all responses from the server.
   */
  headers?: Record<string, string | string[]>;
  /**
   * Routes that are matched after HTML routes and invoke WinterCG-compliant functions.
   */
  apiRoutes: RouteInfo<TRegex>[];
  /**
   * Routes that return static HTML files for a given path.
   * These are only matched against requests with method `GET` and `HEAD`.
   */
  htmlRoutes: RouteInfo<TRegex>[];
  /**
   * List of routes that are matched last and return with status code 404.
   */
  notFoundRoutes: RouteInfo<TRegex>[];
  /**
   * List of routes that match second. Returns 301 and redirects to another path.
   */
  redirects: RouteInfo<TRegex>[];
  /**
   * Rewrites. After middleware has processed and regular routing resumes, these occur first.
   */
  rewrites: RouteInfo<TRegex>[];
}

export type RawManifest = RoutesManifest<string>;
export type Manifest = RoutesManifest<RegExp>;
export type Route = RouteInfo<RegExp>;
