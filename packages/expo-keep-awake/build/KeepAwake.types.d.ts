export type KeepAwakeEvent = {
    /** Keep awake state. */
    state: KeepAwakeEventState;
};
export declare enum KeepAwakeEventState {
    RELEASE = "release"
}
export type KeepAwakeListener = (event: KeepAwakeEvent) => void;
//# sourceMappingURL=KeepAwake.types.d.ts.map