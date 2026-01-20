/**
 * Convert a route's pathname to a loader module path.
 *
 * @example
 * getLoaderModulePath(`/`);       // `/_expo/loaders/index`
 * getLoaderModulePath(`/about`)   // `/_expo/loaders/about`
 * getLoaderModulePath(`/posts/1`) // `/_expo/loaders/posts/1`
 */
export declare function getLoaderModulePath(routePath: string): string;
/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server
 * 2. Production with static files (SSG)
 * 3. SSR environments
 *
 * @see import('packages/@expo/cli/src/start/server/metro/createServerRouteMiddleware.ts').createRouteHandlerMiddleware
 * @see import('packages/expo-server/src/vendor/environment/common.ts').createEnvironment
 */
export declare function fetchLoaderModule(routePath: string): Promise<any>;
//# sourceMappingURL=utils.d.ts.map