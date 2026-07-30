// expo-router is an optional peerDependency of expo-observe. When the host app
// hasn't installed it, `require` throws and the integration becomes a no-op.
interface RouterPageEvent {
  pathname: string;
  params: Record<string, string | string[]>;
  screenId: string;
  segments: string[];
}

interface RouterActionDispatchedEvent {
  actionType: string;
}

interface RouterNavigationEvents {
  addListener(
    eventType: 'actionDispatched',
    callback: (event: RouterActionDispatchedEvent) => void
  ): () => void;
  addListener(
    eventType: 'pagePreloaded' | 'pageFocused',
    callback: (event: RouterPageEvent) => void
  ): () => void;
  enable(): void;
}

interface OptionalRouter {
  unstable_navigationEvents: RouterNavigationEvents;
  useCurrentRouteInfo(): {
    pathname: string;
    params: Record<string, string | string[]>;
    segments: string[];
  };
  useNavigation(): { isFocused(): boolean };
  useRoute(): { key: string };
}

let optionalRouter: OptionalRouter | undefined;
try {
  optionalRouter = require('expo-router') as OptionalRouter;
} catch {
  // expo-router not installed — integration disabled.
}
const isRouterInstalled = !!optionalRouter;

export { optionalRouter, isRouterInstalled };
