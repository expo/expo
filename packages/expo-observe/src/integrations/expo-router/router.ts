// expo-router is an optional peerDependency of expo-observe. When the host app
// hasn't installed it, `require` throws and the integration becomes a no-op.
export interface RouterPageMarkDetail {
  pathname: string;
  params: Record<string, string | string[]>;
  screenId: string;
  segments: string[];
}

type RouterPerformanceMark =
  | { name: 'expo-router:action-dispatched'; startTime: number; detail: { actionType: string } }
  | {
      name:
        | 'expo-router:page-preloaded'
        | 'expo-router:page-focused'
        | 'expo-router:page-blurred'
        | 'expo-router:page-removed';
      startTime: number;
      detail: RouterPageMarkDetail;
    };

export type RouterPerformanceObserver = new (
  callback: (list: { getEntries(): RouterPerformanceMark[] }) => void
) => {
  observe(options: { type: 'mark' }): void;
  disconnect(): void;
};

interface OptionalRouter {
  unstable_performance: { enable(): void };
  unstable_PerformanceObserver: RouterPerformanceObserver;
  useCurrentRouteInfo(): {
    pathname: string;
    params: Record<string, string | string[]>;
    segments: string[];
  };
  useNavigation(): { isFocused(): boolean };
  useRoute(): { key: string };
}

let optionalRouter: OptionalRouter | undefined;
// expo-router is installed, but its version has no performance API to report metrics from.
let isRouterOutdated = false;
try {
  const router = require('expo-router') as OptionalRouter;
  if (router.unstable_PerformanceObserver) {
    optionalRouter = router;
  } else {
    isRouterOutdated = true;
  }
} catch {
  // expo-router not installed — integration disabled.
}
const isRouterInstalled = !!optionalRouter;

export { optionalRouter, isRouterInstalled, isRouterOutdated };
