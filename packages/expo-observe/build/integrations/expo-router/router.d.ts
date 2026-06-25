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
    addListener(eventType: 'actionDispatched', callback: (event: RouterActionDispatchedEvent) => void): () => void;
    addListener(eventType: 'pagePreloaded' | 'pageFocused', callback: (event: RouterPageEvent) => void): () => void;
    enable(): void;
}
interface OptionalRouter {
    unstable_navigationEvents: RouterNavigationEvents;
    useCurrentRouteInfo(): {
        pathname: string;
        params: Record<string, string | string[]>;
        segments: string[];
    };
    useNavigation(): {
        isFocused(): boolean;
    };
    useRoute(): {
        key: string;
    };
}
declare let optionalRouter: OptionalRouter | undefined;
declare const isRouterInstalled: boolean;
export { optionalRouter, isRouterInstalled };
//# sourceMappingURL=router.d.ts.map