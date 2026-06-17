import type { ParamListBase, StackNavigationState } from '../../native';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../types';
type DescribeFn = (route: StackNavigationState<ParamListBase>['preloadedRoutes'][number], placeholder: boolean) => NativeStackDescriptor;
/**
 * Projects preloaded routes as regular routes after `index`, with descriptors covering them.
 * `NativeStackView` treats any route positioned after the focused one as preloaded.
 */
export declare function useProjectedStack(state: StackNavigationState<ParamListBase>, descriptors: NativeStackDescriptorMap, describe: DescribeFn): {
    projectedState: {
        routes: import("../..").NavigationRoute<ParamListBase, string>[];
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        type: "stack";
        stale: false;
        preloadedRoutes: import("../..").NavigationRoute<ParamListBase, string>[];
    };
    projectedDescriptors: NativeStackDescriptorMap;
};
export {};
//# sourceMappingURL=useProjectedStack.d.ts.map