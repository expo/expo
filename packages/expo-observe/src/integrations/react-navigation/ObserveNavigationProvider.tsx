import type { LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { attachActionListener } from './actionListener';
import { ObserveReactNavigationIntegrationContext } from './context';
import { createGetPathname } from './getPathname';
import { createStateChangeHandler } from './handleStateChange';
import { isInitialized } from './init';
import { optionalReactNavigation } from './reactNavigation';
import { createReactNavigationIntegrationStorage } from './storage';
import type { NavigationStateLike } from './types';
import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';

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
export function ObserveNavigationProvider({
  navigationRef,
  linking,
  children,
}: ObserveNavigationProviderProps) {
  if (!optionalReactNavigation) {
    throw new Error(
      '[expo-observe] ObserveNavigationProvider requires @react-navigation/native, ' +
        "but the package couldn't be resolved. Install @react-navigation/native, or " +
        "remove the React Navigation integration if it's not needed."
    );
  }
  if (typeof navigationRef?.addListener !== 'function') {
    throw new Error(
      '[expo-observe] ObserveNavigationProvider received an invalid `navigationRef`. ' +
        'Create it with `useNavigationContainerRef()` (or `createNavigationContainerRef()`) ' +
        'and pass the same ref to your navigation container.'
    );
  }

  const initialized = isInitialized();

  // Built once per mount: the storage, the pathname resolver, and the
  // state-change handler. `null` when the integration isn't initialized so the
  // listener wiring below can no-op.
  const [internal] = useState(() => {
    if (!initialized) return null;
    const storage = createReactNavigationIntegrationStorage();
    const getPathname = createGetPathname(linking);
    return {
      storage,
      getPathname,
      handleStateChange: createStateChangeHandler(storage, getPathname, performance.now()),
    };
  });

  const contextValue = useMemo(
    () => (internal ? { storage: internal.storage, getPathname: internal.getPathname } : null),
    [internal]
  );

  useAssertValueDoesNotChange(
    initialized,
    `[expo-observe] React Navigation integration was toggled after ObserveNavigationProvider mounted. Call \`Observe.configure({ integrations: { 'react-navigation': true } })\` before rendering ObserveNavigationProvider.`
  );

  useEffect(() => {
    if (!internal) return;

    const detachAction = attachActionListener(navigationRef, internal.storage);
    // Handles every navigation after mount. The container emits its first
    // `state` event from its own effect, which runs *before* this one (effects
    // run child-first), so this listener is attached too late to see the
    // initial state — that's what the `isReady()` catch-up below is for.
    const detachState = navigationRef.addListener('state', () => {
      const rootState = navigationRef.getRootState() as unknown as NavigationStateLike | undefined;
      if (rootState) {
        internal.handleStateChange(rootState);
      }
    });

    // Records the initial focused screen. By the time this effect runs the
    // container below has mounted and is ready, but its initial `state` emit
    // already fired before we subscribed, so we read it directly here.
    // `handleStateChange` dedupes by focused key, so on the off chance the
    // listener also fires for the same state, the first screen counts once.
    if (navigationRef.isReady()) {
      const rootState = navigationRef.getRootState() as unknown as NavigationStateLike | undefined;
      if (rootState) {
        internal.handleStateChange(rootState);
      }
    }

    return () => {
      detachAction();
      detachState();
    };
  }, [internal, navigationRef]);

  return (
    <ObserveReactNavigationIntegrationContext.Provider value={contextValue}>
      {children}
    </ObserveReactNavigationIntegrationContext.Provider>
  );
}
