import AppMetrics, { type MetricAttributes } from 'expo-app-metrics';
import { use, useCallback, useEffect, useRef } from 'react';

import { ObserveReactNavigationIntegrationContext } from './context';
import { emitTTI } from './emitTTI';
import { isInitialized } from './init';
import { optionalReactNavigation } from './reactNavigation';
import type { NavigationStateLike } from './types';
import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';

type MarkInteractive = (typeof AppMetrics)['markInteractive'];

export function useObserveForReactNavigation(): MarkInteractive | null {
  const initialized = isInitialized();
  const contextValue = use(ObserveReactNavigationIntegrationContext);
  const isMounted = useRef(true);
  const route = optionalReactNavigation?.useRoute();
  const navigation = optionalReactNavigation?.useNavigation();
  const stateForPath = optionalReactNavigation?.useStateForPath();

  useAssertValueDoesNotChange(
    initialized,
    "[expo-observe] React Navigation integration was toggled during a screen's lifecycle. " +
      "Call `ExpoObserve.configure({ integrations: { 'react-navigation': true } })` once at startup before any screen mounts."
  );

  const screenId = route?.key;
  const prevScreenId = useRef(screenId);
  if (prevScreenId.current !== screenId) {
    console.warn(
      '[expo-observe] Screen ID changed between renders. The hook should be called inside the screen component, not a higher wrapper.'
    );
    prevScreenId.current = screenId;
  }

  useEffect(() => {
    // Strict-mode mounts the effect twice (mount → cleanup → re-mount). Without
    // restoring isMounted here the second mount would leave it permanently false.
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

      if (!contextValue) {
        throw new Error(
          '[expo-observe] markInteractive was called without an active ObserveNavigationContainer. Wrap your tree in <ObserveNavigationContainer>.'
        );
      }
      const { storage, getPathname } = contextValue;

      if (!route) {
        return;
      }
      // `useStateForPath` returns the navigation state subtree rooted at the
      // current screen's path, not the full root state. That's intentional:
      // `getPathFromState` only walks routes/state/params downward, so feeding
      // it the subtree produces the same pathname as the full state without
      // requiring access to the root navigation state from inside a leaf hook.
      const pathname = getPathname(stateForPath as NavigationStateLike | undefined) ?? route.name;
      const routeParams = (route.params as object | undefined) ?? {};

      // Snapshot times BEFORE writing the new interactive timestamp so the
      // duplicate-detection logic below sees the previous call, not this one.
      const currentScreenData = storage.screenTimes[screenId];

      storage.interactiveScreensIds.add(screenId);
      storage.screenTimes[screenId] = {
        ...storage.screenTimes[screenId],
        lastInteractiveCall: now,
      };

      if (!navigation?.isFocused()) {
        return;
      }

      AppMetrics.markInteractive({
        ...(attributes ?? {}),
        routeName: pathname,
      });

      if (currentScreenData?.dispatchTime == null) {
        // `onStateChange` hasn't recorded the dispatch yet. `handleStateChange`
        // will see `lastInteractiveCall` set with no `dispatchTime` and emit
        // TTI = TTR on our behalf.
        return;
      }

      const previousInteractiveCall = currentScreenData.lastInteractiveCall;
      const previousWasAfterDispatch =
        previousInteractiveCall != null && currentScreenData.dispatchTime < previousInteractiveCall;

      if (previousWasAfterDispatch) {
        // Record interactive once per navigation.
        return;
      }

      const interactiveTimeSeconds = (now - currentScreenData.dispatchTime) / 1000;
      const mainSessionId = (await AppMetrics.getMainSession())?.id;
      if (mainSessionId) {
        await emitTTI({
          sessionId: mainSessionId,
          timestamp,
          routeName: pathname,
          value: interactiveTimeSeconds,
          routeParams,
        });
      }
    },
    [screenId, navigation, route, contextValue, stateForPath]
  );

  return initialized ? markInteractive : null;
}
