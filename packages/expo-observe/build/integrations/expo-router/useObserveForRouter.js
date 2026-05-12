import AppMetrics, {} from 'expo-app-metrics';
import { use, useCallback, useEffect, useRef } from 'react';
import { ObserveRouterIntegrationContext } from './ObserveRouterIntegrationProvider';
import { isInitialized } from './init';
import { optionalRouter } from './router';
export function useObserveForRouter() {
    const storage = use(ObserveRouterIntegrationContext);
    const isMounted = useRef(true);
    const route = optionalRouter?.useRoute();
    const navigation = optionalRouter?.useNavigation();
    const routeInfo = optionalRouter?.useCurrentRouteInfo();
    const { pathname, params: routeParams } = routeInfo ?? {};
    const initializedAtMount = useRef(isInitialized());
    if (initializedAtMount.current !== isInitialized()) {
        throw new Error("[expo-observe] Router integration was toggled during a screen's lifecycle. " +
            'Call `ExpoObserve.configure({ disableRouterIntegration })` once at startup before any screen mounts.');
    }
    const screenId = route?.key;
    const prevScreenId = useRef(screenId);
    if (prevScreenId.current !== screenId) {
        console.warn('[expo-observe] Screen ID changed between renders. This is most likely an expo-router bug.');
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
    const markInteractive = useCallback(async (attributes) => {
        const now = performance.now();
        const timestamp = new Date().toISOString();
        if (!isMounted.current) {
            console.warn('[expo-observe] Calling markInteractive on unmounted screen');
            return;
        }
        if (!screenId) {
            console.warn('[expo-observe] No metadata available for the current screen. Make sure to call useObserve inside a screen component.');
            return;
        }
        if (navigation?.isFocused()) {
            AppMetrics.markInteractive({
                ...(attributes ?? {}),
                routeName: pathname,
            });
        }
        if (process.env.EXPO_OS !== 'android') {
            return;
        }
        if (!storage) {
            throw new Error('[expo-observe] markInteractive was called without an active ObserveProvider. Wrap your app in ObserveRoot from expo-observe.');
        }
        // Snapshot times BEFORE writing the new interactive timestamp so the
        // duplicate-detection logic below sees the *previous* call, not this one.
        const currentScreenData = storage.screenTimes[screenId];
        storage.interactiveScreensIds.add(screenId);
        if (storage.screenTimes[screenId]) {
            storage.screenTimes[screenId] = {
                ...storage.screenTimes[screenId],
                lastInteractiveCall: now,
            };
        }
        if (!currentScreenData?.dispatchTime)
            return;
        const previousInteractiveCall = currentScreenData.lastInteractiveCall;
        const previousWasAfterDispatch = previousInteractiveCall != null && currentScreenData.dispatchTime < previousInteractiveCall;
        if (previousWasAfterDispatch) {
            // We only want to record interactive once per navigation
            return;
        }
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
                // TODO(@ubax): Use segments.join here to get full routeName and pass pathname and params via params
                routeName: pathname,
                name: 'tti',
                value: interactiveTimeSeconds,
                params: { routeParams },
            });
        }
    }, [screenId, navigation, pathname, storage, routeParams]);
    return initializedAtMount.current ? markInteractive : null;
}
//# sourceMappingURL=useObserveForRouter.js.map