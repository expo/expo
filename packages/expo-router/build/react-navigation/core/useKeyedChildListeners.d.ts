import type { KeyedListenerMap } from './NavigationBuilderContext';
/**
 * Hook which lets child navigators add getters to be called for obtaining rehydrated state.
 */
export declare function useKeyedChildListeners(): {
    keyedListeners: {
        getState: Record<string, import("./NavigationBuilderContext").GetStateListener | undefined>;
        beforeRemove: Record<string, import("./NavigationBuilderContext").ChildBeforeRemoveListener | undefined>;
    };
    addKeyedListener: <T extends keyof KeyedListenerMap>(type: T, key: string, listener: KeyedListenerMap[T]) => () => void;
};
//# sourceMappingURL=useKeyedChildListeners.d.ts.map