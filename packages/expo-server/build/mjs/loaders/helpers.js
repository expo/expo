/**
 * Creates a loader function for routes that only need route parameters to load data.
 * The callback receives no request object, making it safe to use for both SSG and SSR.
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
 * @see [Data loaders](/router/web/data-loaders) for more information.
 */
export function createStaticLoader(fn) {
    return (_request, params) => fn(params);
}
/**
 * Creates a loader function for routes that need access to the incoming HTTP request.
 * Server loaders run on every request during SSR. If called during SSG where no request is
 * available, this throws an error.
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
 * @see [Data loaders](/router/web/data-loaders) for more information.
 */
export function createServerLoader(fn) {
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