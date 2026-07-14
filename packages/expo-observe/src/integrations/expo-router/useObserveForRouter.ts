import AppMetrics, { type MetricAttributes } from 'expo-app-metrics';
import { use, useCallback, useEffect, useRef } from 'react';

import { getNavigationMetricParams } from '../navigationConfig';
import { ObserveRouterIntegrationContext } from './ObserveRouterIntegrationProvider';
import { emitTTI } from './emitTTI';
import { getRouterIntegrationConfig, isInitialized } from './init';
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
  const routerIntegrationConfig = getRouterIntegrationConfig();

  useAssertValueDoesNotChange(
    initialized,
    "[expo-observe] Router integration was toggled during a screen's lifecycle. " +
      "Call `Observe.configure({ integrations: { 'expo-router': true } })` once at startup before any screen mounts."
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
      if (!storage) {
        throw new Error(
          '[expo-observe] markInteractive was called without an active ObserveProvider. Wrap your app in ObserveRoot from expo-observe.'
        );
      }

      // Snapshot BEFORE the write below so the deferred-TTI check sees the
      // pre-write state (lastInteractiveCall undefined until this call).
      const currentScreenData = storage.screenTimes[screenId];
      const navigationParams = getNavigationMetricParams(
        routerIntegrationConfig,
        routeParams,
        pathname
      );

      // Record lastInteractiveCall regardless of focus so the `pageFocused`
      // listener can emit `tti = ttr` on our behalf when this call lands
      // before `dispatchTime` has been seeded (cold-launch race).
      storage.screenTimes[screenId] = {
        ...storage.screenTimes[screenId],
        lastInteractiveCall: now,
      };

      if (!navigation?.isFocused()) {
        return;
      }

      // TTI is recorded once per screen ID for the lifetime of the storage —
      // re-focusing the same screen (A → B → A) must not produce a second metric
      const wasAlreadyInteractive = storage.interactiveScreensIds.has(screenId);
      storage.interactiveScreensIds.add(screenId);

      // All async work happens after storage is updated, so a concurrent
      // pageFocused observes our writes before its own awaited writes.
      const attributeParams = attributes?.params ?? {};
      const safeAttributeParams = navigationParams.urlHidden
        ? Object.fromEntries(Object.entries(attributeParams).filter(([key]) => key !== 'url'))
        : attributeParams;
      AppMetrics.markInteractive({
        ...(attributes ?? {}),
        routeName: routePattern,
        params: {
          ...safeAttributeParams,
          ...navigationParams,
        },
      });

      if (wasAlreadyInteractive) return;
      if (!currentScreenData?.dispatchTime) {
        // `pageFocused` hasn't recorded the dispatch yet. The focus listener
        // will see `lastInteractiveCall` set with no `dispatchTime` and emit
        // TTI = TTR on our behalf.
        return;
      }

      // Stored in seconds to match the OTel `unit = "s"` convention
      const interactiveTimeSeconds = (now - currentScreenData.dispatchTime) / 1000;
      // TODO(@ubax): we should count the time against the action which caused the first navigation
      // and add a param stating if during that time there was any navigation
      await emitTTI({
        session: AppMetrics.getMainSession(),
        timestamp,
        routeName: routePattern,
        value: interactiveTimeSeconds,
        isAppLaunch: !!currentScreenData.isAppLaunch,
        routeParams,
        url: pathname,
        config: routerIntegrationConfig,
      });
    },
    [screenId, navigation, pathname, routePattern, storage, routeParams, routerIntegrationConfig]
  );

  return initialized ? markInteractive : null;
}
