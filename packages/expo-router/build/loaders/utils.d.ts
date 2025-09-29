/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server (see `LoaderModuleMiddleware`)
 * 2. Production with static files (SSG)
 * 3. SSR environments
 */
export declare function fetchLoaderModule(routePath: string): Promise<any>;
//# sourceMappingURL=utils.d.ts.map