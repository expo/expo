import AppMetrics, { type MetricAttributes } from 'expo-app-metrics';
import { use, useCallback, useEffect, useRef } from 'react';

import { ObserveRouterIntegrationContext } from './ObserveRouterIntegrationProvider';
import { isInitialized } from './init';
import { buildRoutePattern } from './routeName';
import { optionalRouter } from './router';
import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';

type MarkInteractive = (typeof AppMetrics)['markInteractive'];

export function useObserveForRouter(): MarkInteractive | null {
  const initialized = isInitialized();
  const storage = use(ObserveRouterIntegrationContext);
  const isMounted = useRef(true);
  const route = optionalRouter?.useRoute();
  const navigation = optionalRouter?.useNavigation();
  const routeInfo = optionalRouter?.useCurrentRouteInfo();
  const { pathname, params: routeParams, segments } = routeInfo ?? {};
  const routePattern = buildRoutePattern(segments);

  useAssertValueDoesNotChange(
    initialized,
    "[expo-observe] Router integration was toggled during a screen's lifecycle. " +
      "Call `ExpoObserve.configure({ integrations: { 'expo-router': true } })` once at startup before any screen mounts."
  );

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
      const now = performance.now();
      const timestamp = new Date().toISOString();
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
          routeName: routePattern,
          params: { ...(attributes?.params ?? {}), url: pathname },
        });
      }

      if (!storage) {
        throw new Error(
          '[expo-observe] markInteractive was called without an active ObserveProvider. Wrap your app in ObserveRoot from expo-observe.'
        );
      }

      // TTI is recorded once per screen ID for the lifetime of the storage —
      // re-focusing the same screen (A → B → A) must not produce a second metric
      if (storage.interactiveScreensIds.has(screenId)) return;
      storage.interactiveScreensIds.add(screenId);

      const currentScreenData = storage.screenTimes[screenId];
      if (!currentScreenData?.dispatchTime) return;

      // Stored in seconds to match the OTel `unit = "s"` convention
      const interactiveTimeSeconds = (now - currentScreenData.dispatchTime) / 1000;
      const mainSessionId = (await AppMetrics.getMainSession())?.id;
      // TODO(@ubax): we should count the time against the action which caused the first navigation
      // and add a param stating if during that time there was any navigation
      if (mainSessionId) {
        await AppMetrics.addCustomMetricToSession({
          sessionId: mainSessionId,
          timestamp,
          category: 'navigation',
          routeName: routePattern,
          name: 'tti',
          value: interactiveTimeSeconds,
          params: { routeParams, url: pathname },
        });
      }
    },
    [screenId, navigation, pathname, routePattern, storage, routeParams]
  );

  return initialized ? markInteractive : null;
}
