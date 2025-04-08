import { createPages } from './create-pages';
/**
 * Wrapper around `createPages` to pass data from the server to the fn
 *
 * This is separated from the `createPages` function allowing us to keep the createPages
 * in sync with the original Waku implementation.
 *
 * @param fn
 * @returns
 */
export function createExpoPages(fn) {
    return (getRouteOptions) => {
        return {
            default: createPages((a, b) => fn(a, { ...b, getRouteOptions })),
        };
    };
}
//# sourceMappingURL=create-expo-pages.js.map