import AppMetrics from 'expo-app-metrics';

import { emitTTI } from './emitTTI';
import { collectMountedKeys, findFocusedLeaf } from './stateTraversal';
import type { ReactNavigationIntegrationStorage } from './storage';
import type { GetPathname, NavigationStateLike } from './types';

export function createStateChangeHandler(
  storage: ReactNavigationIntegrationStorage,
  getPathname: GetPathname,
  appLaunchTime: number
): (state: NavigationStateLike | undefined) => void {
  let previousFocusedKey: string | null = null;

  return async function handleStateChange(state) {
    if (!state) return;
    // Snapshot clocks once so every metric written below is stamped with
    // the moment the focus actually fired, not the moment
    // `addCustomMetricToSession` happens to run after the awaited
    // `getMainSession()` round-trip.
    const now = performance.now();
    const timestamp = new Date().toISOString();
    // Mark all non-focused mounted screens as already rendered so a later
    // focus on them resolves to `warm_ttr`. Tab-navigator siblings are
    // skipped by `collectMountedKeys` because `lazy: true` (the v7 default)
    // leaves unfocused tabs unmounted.
    const mounted = collectMountedKeys(state);
    const focused = findFocusedLeaf(state);
    // Mostly to satisfy typescript. This should not happen
    if (!focused) return;

    // This needs to happen before keys are added to renderedScreensIds
    const isInitial = !storage.renderedScreensIds.has(focused.key);

    // Snapshot BEFORE the mounted-keys loop writes dispatchTime so the
    // deferred-TTI check sees the focused screen's pre-write state.
    const existingFocusedScreenTimes = storage.screenTimes[focused.key];
    const hasPendingInteractive =
      existingFocusedScreenTimes?.lastInteractiveCall != null &&
      existingFocusedScreenTimes?.dispatchTime == null;

    const last = storage.pendingActions[storage.pendingActions.length - 1];
    const isColdAppLaunch = !storage.hasRecordedInitialTtr;
    const effectiveDispatchTime = isColdAppLaunch ? appLaunchTime : last?.dispatchTime;

    // We want to collect the preloaded screens even if the focused route
    // didn't change. The preload can happen without the focus to change.
    // Also backfill dispatchTime on any mounted screen that doesn't have
    // one yet, so a later `markInteractive` does not set hasPendingInteractive
    // to true
    for (const key of mounted.keys()) {
      storage.renderedScreensIds.add(key);
      if (effectiveDispatchTime != null && storage.screenTimes[key]?.dispatchTime == null) {
        storage.screenTimes[key] = {
          ...storage.screenTimes[key],
          dispatchTime: effectiveDispatchTime,
        };
      }
    }

    if (focused.key === previousFocusedKey) return;
    previousFocusedKey = focused.key;

    const pathname = getPathname(state) ?? focused.route.name;
    const routeParams = focused.route.params ?? {};
    const name = isInitial ? 'cold_ttr' : 'warm_ttr';

    const mainSessionId = (await AppMetrics.getMainSession())?.id;
    if (!mainSessionId) return;

    if (isColdAppLaunch) {
      const appLaunchTtrSeconds = (now - appLaunchTime) / 1000;
      storage.hasRecordedInitialTtr = true;
      if (hasPendingInteractive) {
        storage.screenTimes[focused.key] = {
          ...storage.screenTimes[focused.key],
          lastInteractiveCall: now,
        };
      }
      AppMetrics.addCustomMetricToSession({
        sessionId: mainSessionId,
        timestamp,
        category: 'navigation',
        name,
        routeName: pathname,
        value: appLaunchTtrSeconds,
        params: { isAppLaunch: true, routeParams },
      });
      if (hasPendingInteractive) {
        await emitTTI({
          sessionId: mainSessionId,
          timestamp,
          routeName: pathname,
          value: appLaunchTtrSeconds,
          routeParams,
        });
      }
      storage.pendingActions.length = 0;
      return;
    }

    if (!last) return;
    const ttrSeconds = (now - last.dispatchTime) / 1000;
    if (hasPendingInteractive) {
      storage.screenTimes[focused.key] = {
        ...storage.screenTimes[focused.key],
        lastInteractiveCall: now,
      };
    }

    AppMetrics.addCustomMetricToSession({
      sessionId: mainSessionId,
      timestamp,
      category: 'navigation',
      name,
      routeName: pathname,
      value: ttrSeconds,
      params: { isAppLaunch: false, routeParams },
    });
    if (hasPendingInteractive) {
      await emitTTI({
        sessionId: mainSessionId,
        timestamp,
        routeName: pathname,
        value: ttrSeconds,
        routeParams,
      });
    }
    storage.pendingActions.length = 0;
  };
}
