import { NavigationRouteContext } from '@react-navigation/native';
import { unstable_navigationEvents } from 'expo-router';
import { useCallback, useContext, useMemo, useRef } from 'react';
import AppMetrics from 'expo-app-metrics';

interface EventPayload {
  screenId: string;
  pathname: string;
}

const activeScreens = new Map<
  string,
  {
    renderTime: number;
    focusTime?: number;
    sessionId?: string;
    pathname?: string;
  }
>();

// This happens on the first render of the screen
// This can be either when the screen will be focused, but also when the screen is pre-rendered in the background
function handlePageInitialRender({ screenId, pathname }: EventPayload) {
  const renderTime = Date.now();
  activeScreens.set(screenId, { renderTime, pathname });
  const sessionId = AppMetrics.startSession(
    JSON.stringify({
      pathname,
    })
  );
  const screenData = activeScreens.get(screenId);
  if (screenData) {
    screenData.sessionId = sessionId;
    activeScreens.set(screenId, screenData);
  }
}

// Screen becomes visible to the user
// Can happen multiple times per screen lifecycle
function handlePageFocused(event: EventPayload) {
  const focusTime = Date.now();
  const screenData = activeScreens.get(event.screenId);
  if (screenData) {
    screenData.focusTime = focusTime;
    activeScreens.set(event.screenId, screenData);
  }
}

// Screen is no longer visible to the user
// Can happen multiple times per screen lifecycle
function handlePageBlurred(event: EventPayload) {
  const blurTime = Date.now();
  const screenData = activeScreens.get(event.screenId);
  if (screenData && screenData.focusTime) {
    const durationMs = blurTime - screenData.focusTime;
    if (screenData.sessionId) {
      AppMetrics.addCustomMetricToSession(screenData.sessionId, {
        category: 'routerMetrics',
        name: 'timeOnScreen',
        value: durationMs / 1000,
        routeName: screenData.pathname,
      });
    }
  }
}

// Screen is removed from the navigation stack
function handlePageRemoved(event: EventPayload) {
  const screenData = activeScreens.get(event.screenId);
  if (screenData) {
    activeScreens.delete(event.screenId);
  }
}

let isEnabled = false;

export function startLoggingRouterMetrics() {
  if (isEnabled) {
    return;
  }
  isEnabled = true;
  unstable_navigationEvents.addListener('pageWillRender', handlePageInitialRender);
  unstable_navigationEvents.addListener('pageFocused', handlePageFocused);
  unstable_navigationEvents.addListener('pageBlurred', handlePageBlurred);
  unstable_navigationEvents.addListener('pageRemoved', handlePageRemoved);
}

export function useRouterMetricsHelpers() {
  const route = useContext(NavigationRouteContext);
  const screenId = route?.key;
  const prevScreenId = useRef(screenId);
  if (prevScreenId.current !== screenId) {
    console.warn('[expo-app-metrics] Screen ID changed between renders. This should not happen.');
  }
  const markPageInteractive = useCallback(async () => {
    if (!isEnabled) {
      return;
    }
    if (!screenId) {
      console.warn(
        'No metadata available for the current screen. Make sure to call this hook inside a screen component.'
      );
      return;
    }
    const screenData = activeScreens.get(screenId);
    if (screenData && screenData.sessionId && screenData.renderTime) {
      const interactiveTimeMs = Date.now() - screenData.renderTime;
      const routeName = screenData.pathname;
      const metrics = [
        {
          category: 'routerMetrics',
          name: 'timeToInteractive',
          value: interactiveTimeMs / 1000,
          routeName,
        },
      ];
      if (screenData.focusTime) {
        const noninteractiveTimeMs = Date.now() - screenData.focusTime;
        metrics.push({
          category: 'routerMetrics',
          name: 'noninteractiveTime',
          value: noninteractiveTimeMs / 1000,
          routeName,
        });
      }
      await Promise.all(
        metrics.map((metric) =>
          AppMetrics.addCustomMetricToSession(screenData.sessionId!, {
            category: metric.category,
            name: metric.name,
            value: metric.value,
            routeName: metric.routeName,
          })
        )
      );
    }
  }, [screenId]);

  return useMemo(() => ({ markPageInteractive }), [markPageInteractive]);
}
