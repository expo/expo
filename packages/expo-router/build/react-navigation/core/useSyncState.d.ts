export declare function useSyncState<T>(getInitialState: () => T): {
    readonly state: T;
    readonly getState: () => T;
    readonly setState: (newState: T) => void;
    readonly scheduleUpdate: (callback: () => void) => void;
    readonly flushUpdates: () => void;
};
//# sourceMappingURL=useSyncState.d.ts.map