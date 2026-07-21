import AppMetrics from 'expo-app-metrics';

import type { ObserveIntegrationsConfig } from '../../types';
import { getNavigationMetricParams } from '../navigationConfig';
import { emitTTI } from './emitTTI';
import { buildRoutePattern } from './routeName';
import { optionalRouter } from './router';
import { type RouterIntegrationStorage } from './storage';

// TODO(@ubax): split this module into `.native.ts` / `.web.ts` variants so the
// web bundle doesn't pull in `expo-app-metrics`' native bridge calls. The web
// version should be an explicit no-op (return a noop cleanup) rather than
// relying on the web stubs in `expo-app-metrics/module.web.ts`.

let initialized = false;
let routerIntegrationConfig: ObserveIntegrationsConfig['expo-router'];

export const isInitialized = () => initialized;
export const getRouterIntegrationConfig = () => routerIntegrationConfig;

export function initRouterIntegration(config?: ObserveIntegrationsConfig['expo-router']) {
  initialized = true;
  routerIntegrationConfig = config;
  optionalRouter?.unstable_navigationEvents.enable();
}

type NavigationEvents = NonNullable<typeof optionalRouter>['unstable_navigationEvents'];

export function initListeners(
  storage: RouterIntegrationStorage,
  navigationEvents: NavigationEvents
): () => void {
  const appLaunchTime = performance.now();
  const cleanup = new Set<() => void>();

  // TODO(action-telemetry): expo-router removed its `actionDispatched` navigation event (part of
  // dropping the dispatch-telemetry surface). Guard the subscription so a host on the new
  // expo-router doesn't throw from `addListener`; a follow-up reseeds dispatch time via the
  // replacement telemetry signal, restoring warm-navigation TTR.
  try {
    const unsubscribeAction = navigationEvents.addListener('actionDispatched', (event) => {
      // PRELOAD comes from router.prefetch() — a route warm-up, not a user
      // navigation — so it must not seed dispatchTime.
      if (event.actionType === 'PRELOAD') return;
      storage.pendingActions.push({
        actionType: event.actionType,
        dispatchTime: performance.now(),
      });
    });
    cleanup.add(unsubscribeAction);
  } catch {
    // `actionDispatched` isn't available on this expo-router version — action-dispatch timing stays
    // unseeded (warm_ttr won't emit) until the replacement signal lands. See TODO above.
  }

  const unsubscribePreload = navigationEvents.addListener('pagePreloaded', (e) => {
    // The screen rendered as part of a preload. Mark it as already rendered so
    // the eventual `pageFocused` resolves to `warm_ttr` rather than `cold_ttr`.
    storage.renderedScreensIds.add(e.screenId);
  });
  cleanup.add(unsubscribePreload);

  const unsubscribeFocus = navigationEvents.addListener('pageFocused', async (e) => {
    // Snapshot both clocks once so every metric written below is stamped with
    // the moment the focus event fired, not the moment `addMetric` happens to run
    // after the surrounding async work.
    const now = performance.now();
    const timestamp = new Date().toISOString();

    // Snapshot BEFORE seeding dispatchTime below so the deferred-TTI check
    // sees the pre-focus state of this screen. A pending interactive means
    // `markInteractive` ran before this focus landed.
    const existingFocusedScreenTimes = storage.screenTimes[e.screenId];
    const hasPendingInteractive =
      existingFocusedScreenTimes?.lastInteractiveCall != null &&
      existingFocusedScreenTimes?.dispatchTime == null;

    const isInitial = !storage.renderedScreensIds.has(e.screenId);
    storage.renderedScreensIds.add(e.screenId);
    const name = isInitial ? 'cold_ttr' : 'warm_ttr';
    const routePattern = buildRoutePattern(e.segments);

    // Resolve which clock anchors the TTR span. Initial focus diffs against
    // app launch; subsequent focuses diff against the last dispatched action.
    let dispatchTime: number;
    let isAppLaunch: boolean;
    if (!storage.hasRecordedInitialTtr) {
      storage.hasRecordedInitialTtr = true;
      dispatchTime = appLaunchTime;
      isAppLaunch = true;
    } else {
      const last = storage.pendingActions[storage.pendingActions.length - 1];
      if (!last) return;
      dispatchTime = last.dispatchTime;
      isAppLaunch = false;
      storage.pendingActions.length = 0;
    }

    // Stored in seconds to match the OTel `unit = "s"` convention
    const ttrSeconds = (now - dispatchTime) / 1000;

    // Write all storage updates BEFORE awaiting anything so a concurrent
    // markInteractive sees the seeded dispatchTime and emits its own TTI
    // instead of racing the deferred-TTI branch below.
    storage.screenTimes[e.screenId] = {
      ...storage.screenTimes[e.screenId],
      dispatchTime,
      isAppLaunch,
      ...(hasPendingInteractive ? { lastInteractiveCall: now } : {}),
    };
    if (hasPendingInteractive) {
      // `markInteractive` ran before this focus, so emit TTI = TTR — the
      // screen wasn't interactive any earlier than it was focused.
      storage.interactiveScreensIds.add(e.screenId);
    }

    const mainSession = AppMetrics.getMainSession();
    const navigationParams = getNavigationMetricParams(
      routerIntegrationConfig,
      e.params,
      e.pathname
    );

    mainSession.addMetric({
      timestamp,
      category: 'navigation',
      name,
      routeName: routePattern,
      value: ttrSeconds,
      params: { isAppLaunch, ...navigationParams },
    });
    if (hasPendingInteractive) {
      await emitTTI({
        session: mainSession,
        timestamp,
        routeName: routePattern,
        value: ttrSeconds,
        isAppLaunch,
        routeParams: e.params,
        url: e.pathname,
        config: routerIntegrationConfig,
      });
    }
  });
  cleanup.add(unsubscribeFocus);

  return () => {
    cleanup.forEach((c) => c());
    cleanup.clear();
  };
}
