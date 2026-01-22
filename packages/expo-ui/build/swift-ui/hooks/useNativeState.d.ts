export type NativeStateRef = {
    __nativeStateId: string;
    __initialValue: string;
    get: () => string;
    set: (value: string) => void;
};
export declare function useNativeState(initialValue: string): NativeStateRef;
declare global {
    var ExpoNativeState: {
        create: (stateId: string, initialValue: string) => void;
        get: (stateId: string) => string;
        set: (stateId: string, value: string) => void;
        delete: (stateId: string) => void;
    } | undefined;
}
//# sourceMappingURL=useNativeState.d.ts.map