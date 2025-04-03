import { createPages } from './create-pages';
import { Options as GetRoutesOptions } from '../../getRoutes';
import { EntriesDev } from '../server';
type CreatePagesFn = Parameters<typeof createPages>[0];
type CreatePagesFns = Parameters<CreatePagesFn>[0];
type CreatePagesOptions = Parameters<CreatePagesFn>[1] & {
    getRouteOptions?: GetRoutesOptions;
};
/**
 * Wrapper around `createPages` to pass data from the server to the fn
 *
 * This is separated from the `createPages` function allowing us to keep the createPages
 * in sync with the original Waku implementation.
 *
 * @param fn
 * @returns
 */
export declare function createExpoPages(fn: (fn: CreatePagesFns, options: CreatePagesOptions) => ReturnType<CreatePagesFn>): (getRouteOptions?: GetRoutesOptions) => EntriesDev;
export {};
//# sourceMappingURL=create-expo-pages.d.ts.map