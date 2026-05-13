import AppMetrics from 'expo-app-metrics';
import { optionalRouter } from './router';
import {} from './storage';
// TODO(@ubax): split this module into `.native.ts` / `.web.ts` variants so the
// web bundle doesn't pull in `expo-app-metrics`' native bridge calls. The web
// version should be an explicit no-op (return a noop cleanup) rather than
// relying on the web stubs in `expo-app-metrics/module.web.ts`.
let initialized = false;
export const isInitialized = () => initialized;
export function initRouterIntegration() {
    initialized = true;
    optionalRouter?.unstable_navigationEvents.enable();
}
export function initListeners(storage, navigationEvents) {
    const appLaunchTime = performance.now();
    const cleanup = new Set();
    const unsubscribeAction = navigationEvents.addListener('actionDispatched', (event) => {
        // TODO(@ubax): Handle screen preloading
        // PRELOAD comes from router.prefetch() — a route warm-up, not a user
        // navigation — so it must not seed dispatchTime.
        if (event.actionType === 'PRELOAD')
            return;
        storage.pendingActions.push({
            actionType: event.actionType,
            dispatchTime: performance.now(),
        });
    });
    cleanup.add(unsubscribeAction);
    const unsubscribeFocus = navigationEvents.addListener('pageFocused', async (e) => {
        // Snapshot both clocks once so every metric written below is stamped with
        // the moment the focus event fired, not the moment `addCustomMetricToSession`
        // happens to run after the awaited `getMainSession()` round-trip.
        const now = performance.now();
        const timestamp = new Date().toISOString();
        const isInitial = !storage.renderedScreensIds.has(e.screenId);
        storage.renderedScreensIds.add(e.screenId);
        const mainSessionId = (await AppMetrics.getMainSession())?.id;
        if (!mainSessionId) {
            return;
        }
        if (!storage.hasRecordedInitialTtr) {
            // Stored in seconds to match the OTel `unit = "s"` convention
            const appLaunchTtrSeconds = (now - appLaunchTime) / 1000;
            storage.hasRecordedInitialTtr = true;
            AppMetrics.addCustomMetricToSession({
                sessionId: mainSessionId,
                timestamp,
                category: 'navigation',
                name: 'ttr',
                routeName: e.pathname,
                value: appLaunchTtrSeconds,
                params: { isInitial, isAppLaunch: true, routeParams: e.params },
            });
            return;
        }
        if (storage.pendingActions.length === 0)
            return;
        const last = storage.pendingActions[storage.pendingActions.length - 1];
        if (last) {
            const dispatchTime = last.dispatchTime;
            storage.screenTimes[e.screenId] = {
                ...storage.screenTimes[e.screenId],
                dispatchTime,
            };
            AppMetrics.addCustomMetricToSession({
                sessionId: mainSessionId,
                timestamp,
                category: 'navigation',
                name: 'ttr',
                routeName: e.pathname,
                value: (now - dispatchTime) / 1000,
                params: { isInitial, isAppLaunch: false, routeParams: e.params },
            });
        }
        storage.pendingActions.length = 0;
    });
    cleanup.add(unsubscribeFocus);
    return () => {
        cleanup.forEach((c) => c());
        cleanup.clear();
    };
}
//# sourceMappingURL=init.js.map