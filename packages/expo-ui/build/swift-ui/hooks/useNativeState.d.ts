export type OnChangeSyncCallback<T> = (value: T) => void;
export type NativeStateRef<T> = {
    __nativeStateId: string;
    __initialValue: T;
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: OnChangeSyncCallback<T>) => void;
};
export declare function useNativeState<T>(initialValue: T): NativeStateRef<T>;
//# sourceMappingURL=useNativeState.d.ts.map