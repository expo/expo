import type { NavigationContainerRef } from '@react-navigation/native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { attachActionListener } from './actionListener';
import { ObserveReactNavigationIntegrationContext } from './context';
import { createStateChangeHandler } from './handleStateChange';
import { isInitialized } from './init';
import { optionalReactNavigation } from './reactNavigation';
import { createReactNavigationIntegrationStorage } from './storage';
import type { NavigationStateLike } from './types';
import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';

export interface ObserveNavigationProviderProps {
  /**
   * The navigation ref the app passes to its navigation container. Create it
   * with `useNavigationContainerRef()` (or `createNavigationContainerRef()`)
   * and pass the same ref to the container, for example
   * `<Navigation ref={navigationRef} />`.
   */
  navigationRef: NavigationContainerRef<ReactNavigation.RootParamList>;
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
export function ObserveNavigationProvider({
  navigationRef,
  children,
}: ObserveNavigationProviderProps) {
  if (!optionalReactNavigation) {
    throw new Error(
      '[expo-observe] ObserveNavigationProvider requires @react-navigation/native, ' +
        "but the package couldn't be resolved. Install @react-navigation/native, or " +
        "remove the React Navigation integration if it's not needed."
    );
  }
  if (
    typeof navigationRef?.addListener !== 'function' ||
    typeof navigationRef?.getRootState !== 'function' ||
    typeof navigationRef?.isReady !== 'function'
  ) {
    throw new Error(
      '[expo-observe] ObserveNavigationProvider received a `navigationRef` that is not a ' +
        'navigation container ref, so it cannot listen to navigation events. Create the ref ' +
        'with `useNavigationContainerRef()` (or `createNavigationContainerRef()`) and pass ' +
        'the same ref to both your navigation container and ObserveNavigationProvider.'
    );
  }

  const initialized = isInitialized();

  const [internal] = useState(() => {
    if (!initialized) return null;
    const storage = createReactNavigationIntegrationStorage();
    return {
      storage,
      handleStateChange: createStateChangeHandler(storage, performance.now()),
    };
  });

  useAssertValueDoesNotChange(
    initialized,
    `[expo-observe] React Navigation integration was toggled after ObserveNavigationProvider mounted. Call \`Observe.configure({ integrations: { 'react-navigation': true } })\` before rendering ObserveNavigationProvider.`
  );

  useEffect(() => {
    if (!internal) return;

    // The `state` event payload can be partial on the initial commit, so
    // always read the hydrated state from the ref.
    const processRootState = () => {
      const rootState = navigationRef.getRootState() as unknown as NavigationStateLike | undefined;
      if (rootState) {
        internal.handleStateChange(rootState);
      }
    };

    const detachActionListener = attachActionListener(navigationRef, internal.storage);
    // Unlike the `onStateChange` prop, the `state` ref event also fires for
    // the initial commit — but child effects run before parent effects, so by
    // the time this effect subscribes, the container rendered below has
    // already emitted it. The `isReady()` catch-up reads that missed initial
    // state directly; `handleStateChange` dedupes by focused route key, so if
    // the listener also sees the same state, the first screen counts once.
    const detachStateListener = navigationRef.addListener('state', processRootState);
    if (navigationRef.isReady()) {
      processRootState();
    }

    return () => {
      detachActionListener();
      detachStateListener();
    };
  }, [internal, navigationRef]);

  const contextValue = useMemo(() => (internal ? { storage: internal.storage } : null), [internal]);

  return (
    <ObserveReactNavigationIntegrationContext.Provider value={contextValue}>
      {children}
    </ObserveReactNavigationIntegrationContext.Provider>
  );
}
