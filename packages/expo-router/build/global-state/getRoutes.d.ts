import type { Platform } from 'react-native';
import { RouteNode } from '../Route';
import { RequireContext } from '../types';
export type Options = {
    ignore?: RegExp[];
    preserveApiRoutes?: boolean;
    ignoreRequireErrors?: boolean;
    ignoreEntryPoints?: boolean;
    unstable_platform?: typeof Platform.OS;
    unstable_stripLoadRoute?: boolean;
    unstable_improvedErrorMessages?: boolean;
};
/** Given a Metro context module, return an array of nested routes. */
export declare function getRoutes(contextModule: RequireContext, options?: Options): RouteNode | null;
//# sourceMappingURL=getRoutes.d.ts.map