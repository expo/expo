import type { ListenerMap } from './NavigationBuilderContext';
/**
 * Hook which lets child navigators add action listeners.
 */
export declare function useChildListeners(): {
    listeners: {
        action: import("./NavigationBuilderContext").ChildActionListener[];
        focus: import("./NavigationBuilderContext").FocusedNavigationListener[];
    };
    addListener: <T extends keyof ListenerMap>(type: T, listener: ListenerMap[T]) => () => void;
};
//# sourceMappingURL=useChildListeners.d.ts.map