import { RequireContext } from '../types';
export declare function createMockContextModule(map?: Record<string, Record<string, any>>): RequireContext;
export declare function configFromFs(map?: (string | [string, object])[]): {
    initialRouteName?: string | undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
};
//# sourceMappingURL=mockState.d.ts.map