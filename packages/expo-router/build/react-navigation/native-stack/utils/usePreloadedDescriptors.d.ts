import type { ParamListBase, StackNavigationState } from '../../native';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from '../types';
type DescribeFn = (route: StackNavigationState<ParamListBase>['preloadedRoutes'][number], placeholder: boolean) => NativeStackDescriptor;
/**
 * Extends the descriptors map with descriptors for the preloaded routes, which
 * `useNavigationBuilder` does not describe.
 */
export declare function usePreloadedDescriptors(preloadedRoutes: StackNavigationState<ParamListBase>['preloadedRoutes'], descriptors: NativeStackDescriptorMap, describe: DescribeFn): NativeStackDescriptorMap;
export {};
//# sourceMappingURL=usePreloadedDescriptors.d.ts.map