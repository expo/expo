import AppMetrics from 'expo-app-metrics';

import { isExpoRouterInitialized, useObserveForRouter } from './integrations/expo-router';
import { useAssertValueDoesNotChange } from './useAssertValueDoesNotChange';

export function useObserve() {
  const expoRouterInitialized = isExpoRouterInitialized();

  useAssertValueDoesNotChange(
    expoRouterInitialized,
    "[expo-observe] Router integration was toggled during a screen's lifecycle. " +
      "Call `ExpoObserve.configure({ integrations: { 'expo-router': true } })` once at startup before any screen mounts."
  );
  // useAssertValueDoesNotChange asserts that the useObserveForRouter is either rendered
  // or not for the whole lifecycle of this hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const routerMarkInteractive = expoRouterInitialized ? useObserveForRouter() : undefined;

  return {
    markInteractive: routerMarkInteractive ?? AppMetrics.markInteractive,
  };
}
