import { use, useCallback, useState, useEffect, useRef } from 'react';

import { isImperativeRouterBound } from '../global-state/routingQueueContext';
import {
  NavigationContainerRefContext,
  type NavigationProp,
  type NavigationState,
  useNavigation,
} from '../react-navigation/native';

type GenericNavigation = NavigationProp<ReactNavigation.RootParamList> & {
  getState(): NavigationState | undefined;
};

/** Returns a callback which is invoked when the navigation state has loaded. */
export function useLoadedNavigation() {
  const navigation = useNavigation();
  const rootNavigation = use(NavigationContainerRefContext);
  const isMounted = useRef(true);
  const pending = useRef<((navigation: GenericNavigation) => void)[]>([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const flush = useCallback(() => {
    if (isMounted.current) {
      const pendingCallbacks = pending.current;
      pending.current = [];
      pendingCallbacks.forEach((callback) => {
        callback(navigation as GenericNavigation);
      });
    }
  }, [navigation]);

  useEffect(() => {
    if (rootNavigation) {
      flush();
    }
  }, [flush, rootNavigation]);

  const push = useCallback(
    (fn: (navigation: GenericNavigation) => void) => {
      pending.current.push(fn);
      if (rootNavigation) {
        flush();
      }
    },
    [flush, rootNavigation]
  );

  return push;
}

export function useOptionalNavigation(): GenericNavigation | null {
  const currentNavigation = useNavigation();
  const rootNavigation = use(NavigationContainerRefContext);
  // After the first render, `useLoadedNavigation` flushes this same navigation right after mount,
  // so seeding it avoids an extra render of the calling screen. During the first render the
  // imperative router is not bound yet, so keep waiting for the effect there.
  const [navigation, setNavigation] = useState<GenericNavigation | null>(() =>
    // Same cast as the `flush` callback in `useLoadedNavigation`.
    rootNavigation && isImperativeRouterBound() ? (currentNavigation as GenericNavigation) : null
  );
  const loadNavigation = useLoadedNavigation();

  useEffect(() => {
    loadNavigation((nav) => setNavigation(nav));
  }, []);

  return navigation;
}
