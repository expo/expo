import type { LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { type ReactNode } from 'react';
export interface ObserveNavigationProviderProps {
    /**
     * The navigation ref the app passes to its container. Create it with
     * `useNavigationContainerRef()` (or `createNavigationContainerRef()`) and
     * pass the same ref to `<Navigation ref={navigationRef} />`.
     */
    navigationRef: NavigationContainerRef<ReactNavigation.RootParamList>;
    /**
     * The same `linking` config passed to the navigation container. Used to
     * resolve a human-readable path per screen; without it, screens fall back to
     * their `route.name`.
     */
    linking?: LinkingOptions<ReactNavigation.RootParamList>;
    children: ReactNode;
}
/**
 * Instruments React Navigation's static configuration (and any setup that
 * can't use {@link ObserveNavigationContainer}) by listening to a
 * caller-provided `navigationRef`. Wrap your navigation tree with it:
 *
 * ```tsx
 * const Navigation = createStaticNavigation(RootStack);
 * const navigationRef = useNavigationContainerRef();
 * return (
 *   <ObserveNavigationProvider navigationRef={navigationRef} linking={linking}>
 *     <Navigation ref={navigationRef} linking={linking} />
 *   </ObserveNavigationProvider>
 * );
 * ```
 *
 * It provides the screen-scoped context that `useObserve()` reads, so it must
 * be an ancestor of every screen.
 */
export declare function ObserveNavigationProvider({ navigationRef, linking, children, }: ObserveNavigationProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ObserveNavigationProvider.d.ts.map