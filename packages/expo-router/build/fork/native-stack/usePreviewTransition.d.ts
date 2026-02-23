import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import type { NativeStackDescriptor, NativeStackDescriptorMap } from './descriptors-context';
/** Mirrors the `describe` function returned by `useNavigationBuilder` */
type DescribeFn = (route: StackNavigationState<ParamListBase>['preloadedRoutes'][number], placeholder: boolean) => NativeStackDescriptor;
/**
 * Manages the preview transition state for link previews.
 *
 * Tracks when a preloaded screen is transitioning on the native side (after
 * the preview is committed) but before React Navigation state is updated.
 * During this window, the hook synthesizes state/descriptors to keep native
 * and JS state in sync.
 */
export declare function usePreviewTransition<TNavigation extends {
    emit: (...args: any[]) => any;
}>(state: StackNavigationState<ParamListBase>, navigation: TNavigation, descriptors: NativeStackDescriptorMap, describe: DescribeFn): {
    computedState: StackNavigationState<ParamListBase>;
    computedDescriptors: NativeStackDescriptorMap;
    navigationWrapper: TNavigation;
};
export {};
//# sourceMappingURL=usePreviewTransition.d.ts.map