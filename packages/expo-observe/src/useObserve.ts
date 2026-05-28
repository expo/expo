import AppMetrics from 'expo-app-metrics';

import { isExpoRouterInitialized, useObserveForRouter } from './integrations/expo-router';
import {
  isReactNavigationInitialized,
  useObserveForReactNavigation,
} from './integrations/react-navigation';
import { useAssertValueDoesNotChange } from './useAssertValueDoesNotChange';

export function useObserve() {
  const expoRouterInitialized = isExpoRouterInitialized();
  const reactNavigationInitialized = isReactNavigationInitialized();

  useAssertValueDoesNotChange(
    expoRouterInitialized,
    "[expo-observe] Router integration was toggled during a screen's lifecycle. " +
      "Call `Observe.configure({ integrations: { 'expo-router': true } })` once at startup before any screen mounts."
  );
  // useAssertValueDoesNotChange asserts that the useObserveForRouter is either rendered
  // or not for the whole lifecycle of this hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const routerMarkInteractive = expoRouterInitialized ? useObserveForRouter() : undefined;

  useAssertValueDoesNotChange(
    reactNavigationInitialized,
    "[expo-observe] React Navigation integration was toggled during a screen's lifecycle. " +
      "Call `Observe.configure({ integrations: { 'react-navigation': true } })` once at startup before any screen mounts."
  );
  // useAssertValueDoesNotChange asserts that the useObserveForReactNavigation is either rendered
  // or not for the whole lifecycle of this hook
  const reactNavigationMarkInteractive = reactNavigationInitialized
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useObserveForReactNavigation()
    : undefined;

  return {
    markInteractive:
      routerMarkInteractive ?? reactNavigationMarkInteractive ?? AppMetrics.markInteractive,
  };
}
