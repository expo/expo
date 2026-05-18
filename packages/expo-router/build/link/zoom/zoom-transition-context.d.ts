export type ZoomTransitionSourceContextValueType = {
    identifier: string;
    hasZoomSource: boolean;
    addSource: () => void;
    removeSource: () => void;
} | undefined;
export declare const ZoomTransitionSourceContext: import("react").Context<ZoomTransitionSourceContextValueType>;
/**
 * Defines the screen bounds where interactive dismissal gestures are allowed for zoom transitions.
 *
 * @platform ios
 */
export interface DismissalBoundsRect {
    /**
     * Minimum X coordinate (left edge) where dismissal gestures are allowed.
     */
    minX?: number;
    /**
     * Maximum X coordinate (right edge) where dismissal gestures are allowed.
     */
    maxX?: number;
    /**
     * Minimum Y coordinate (top edge) where dismissal gestures are allowed.
     */
    minY?: number;
    /**
     * Maximum Y coordinate (bottom edge) where dismissal gestures are allowed.
     */
    maxY?: number;
}
export interface ZoomTransitionTargetContextValueType {
    identifier: string | null;
    dismissalBoundsRect: DismissalBoundsRect | undefined | null;
    setDismissalBoundsRect: (rect: DismissalBoundsRect | null) => void;
    addEnabler: () => void;
    removeEnabler: () => void;
    hasEnabler: boolean;
}
export declare const ZoomTransitionTargetContext: import("react").Context<ZoomTransitionTargetContextValueType>;
//# sourceMappingURL=zoom-transition-context.d.ts.map