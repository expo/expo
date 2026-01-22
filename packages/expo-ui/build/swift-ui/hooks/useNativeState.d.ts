export type OnChangeSyncCallback = (text: string) => void;
export type NativeStateRef = {
    __nativeStateId: string;
    __initialValue: string;
    get: () => string;
    set: (value: string) => void;
    onChange: (callback: OnChangeSyncCallback) => void;
};
export declare function useNativeState(initialValue: string): NativeStateRef;
//# sourceMappingURL=useNativeState.d.ts.map