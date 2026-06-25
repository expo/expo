import { type ReactNode } from 'react';
import type { NavigationContainerRefLike } from './types';
export interface ObserveNavigationProviderProps {
    /**
     * The navigation ref the app passes to its navigation container. Create it
     * with `useNavigationContainerRef()` (or `createNavigationContainerRef()`)
     * and pass the same ref to the container, for example
     * `<Navigation ref={navigationRef} />`.
     */
    navigationRef: NavigationContainerRefLike;
    children: ReactNode;
}
/**
 * Instruments React Navigation through a caller-provided `navigationRef`, for
 * setups where the container isn't yours to replace — most notably
 * [static configuration](https://reactnavigation.org/docs/static-configuration/).
 * Must be an ancestor of every screen so `useObserve()` works inside them.
 *
 * ```tsx
 * <ObserveNavigationProvider navigationRef={navigationRef}>
 *   <Navigation ref={navigationRef} />
 * </ObserveNavigationProvider>
 * ```
 */
export declare function ObserveNavigationProvider({ navigationRef, children, }: ObserveNavigationProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ObserveNavigationProvider.d.ts.map