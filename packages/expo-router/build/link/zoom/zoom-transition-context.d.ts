export type ZoomTransitionSourceContextValueType = {
    identifier: string;
    hasZoomSource: boolean;
    addSource: () => void;
    removeSource: () => void;
} | undefined;
export declare const ZoomTransitionSourceContext: import("react").Context<ZoomTransitionSourceContextValueType>;
export interface ZoomTransitionTargetContextValueType {
    identifier: string | null;
}
export declare const ZoomTransitionTargetContext: import("react").Context<ZoomTransitionTargetContextValueType>;
//# sourceMappingURL=zoom-transition-context.d.ts.map