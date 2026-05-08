import AppMetrics, { type MetricAttributes } from 'expo-app-metrics';
import { useCallback, useEffect, useRef } from 'react';

import { isInitialized } from './init';
import { optionalRouter } from './router';

type MarkInteractive = (typeof AppMetrics)['markInteractive'];

export function useObserveForRouter(): MarkInteractive | null {
  const isMounted = useRef(true);
  const route = optionalRouter?.useRoute();
  const navigation = optionalRouter?.useNavigation();
  const pathname = optionalRouter?.useCurrentRouteInfo()?.pathname;

  const initializedAtMount = useRef(isInitialized());
  if (initializedAtMount.current !== isInitialized()) {
    throw new Error(
      "[expo-observe] Router integration was toggled during a screen's lifecycle. " +
        'Call `ExpoObserve.configure({ disableRouterIntegration })` once at startup before any screen mounts.'
    );
  }

  const screenId = route?.key;
  const prevScreenId = useRef(screenId);
  if (prevScreenId.current !== screenId) {
    console.warn(
      '[expo-observe] Screen ID changed between renders. This is most likely an expo-router bug.'
    );
    prevScreenId.current = screenId;
  }

  useEffect(() => {
    // Strict-mode mounts the effect twice (mount → cleanup → re-mount). Without
    // restoring isMounted here, the second mount would leave it permanently false
    // and every markInteractive call would warn "unmounted screen".
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const markInteractive = useCallback(
    async (attributes?: MetricAttributes) => {
      if (!isMounted.current) {
        console.warn('[expo-observe] Calling markInteractive on unmounted screen');
        return;
      }
      if (!screenId) {
        console.warn(
          '[expo-observe] No metadata available for the current screen. Make sure to call useObserve inside a screen component.'
        );
        return;
      }
      if (navigation?.isFocused()) {
        AppMetrics.markInteractive({
          ...(attributes ?? {}),
          routeName: pathname,
        });
      }
    },
    [screenId, navigation, pathname]
  );

  return initializedAtMount.current ? markInteractive : null;
}
