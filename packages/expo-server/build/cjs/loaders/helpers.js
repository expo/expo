"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaticLoader = createStaticLoader;
exports.createServerLoader = createServerLoader;
/**
 * Creates a static loader function for routes that only need route parameters to load data.
 * The callback receives no request object, making it safe to use during both SSG builds
 * and SSR.
 *
 * @param fn - A callback that receives route params and returns data
 * @returns A `LoaderFunction` compatible with `useLoaderData<typeof loader>()`
 *
 * @example
 * ```ts
 * import { createStaticLoader } from 'expo-server';
 *
 * export const loader = createStaticLoader(async (params) => {
 *   const post = await fetchPost(params.id);
 *   return { post };
 * });
 * ```
 */
function createStaticLoader(fn) {
    return (_request, params) => fn(params);
}
/**
 * Creates a server loader function for routes that need access to the incoming HTTP request
 * (headers, URL, etc.). Server loaders run on every request during SSR and will throw
 * during SSG builds where no request is available.
 *
 * @param fn - A callback that receives a guaranteed `ImmutableRequest` and route params
 * @returns A `LoaderFunction` compatible with `useLoaderData<typeof loader>()`
 *
 * @example
 * ```ts
 * import { createServerLoader } from 'expo-server';
 *
 * export const loader = createServerLoader(async (request, params) => {
 *   const authHeader = request.headers.get('Authorization');
 *   return { authenticated: !!authHeader };
 * });
 * ```
 */
function createServerLoader(fn) {
    return (request, params) => {
        if (!request) {
            throw new Error('Server loader was called without a request. Server loaders require SSR and cannot be ' +
                'used during static site generation (SSG). To create a loader that works with SSG, use ' +
                'createStaticLoader instead.');
        }
        return fn(request, params);
    };
}
//# sourceMappingURL=helpers.js.map