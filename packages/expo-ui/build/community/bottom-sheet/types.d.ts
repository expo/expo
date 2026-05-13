import type { ComponentType, ReactNode, Ref } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
/**
 * Imperative methods exposed via ref on the `BottomSheet` component.
 * Compatible with `@gorhom/bottom-sheet` `BottomSheetMethods`.
 */
export interface BottomSheetMethods {
    /**
     * Snap to a snap point by index.
     *
     * @remarks On Android, only two snap states are supported (partial and expanded).
     * Indices are mapped to the nearest available state.
     */
    snapToIndex: (index: number) => void;
    /**
     * Snap to an arbitrary position.
     * @param position - A pixel value or percentage string (e.g., `'50%'` or `200`).
     *
     * @remarks On iOS and Android, this is mapped to the nearest available detent/state.
     * Arbitrary positioning is only fully supported on web.
     */
    snapToPosition: (position: string | number) => void;
    /**
     * Snap to the maximum (highest) snap point.
     *
     * @remarks On Android, this expands to full screen.
     */
    expand: () => void;
    /**
     * Snap to the minimum (lowest) snap point.
     *
     * @remarks On Android, this snaps to the partially expanded state (~50% height).
     */
    collapse: () => void;
    /**
     * Close the bottom sheet.
     */
    close: () => void;
    /**
     * Force close the bottom sheet, preventing gesture interruptions.
     *
     * @remarks Behaves identically to `close()` in this implementation,
     * as native sheets do not support gesture interruption during close.
     */
    forceClose: () => void;
    /**
     * Present the bottom sheet (open at the first snap point).
     * Compatible with `@gorhom/bottom-sheet` `BottomSheetModal.present()`.
     */
    present: () => void;
    /**
     * Dismiss the bottom sheet.
     * Compatible with `@gorhom/bottom-sheet` `BottomSheetModal.dismiss()`.
     */
    dismiss: () => void;
}
/**
 * Props for custom handle components.
 * Compatible with `@gorhom/bottom-sheet` `BottomSheetHandleProps`.
 */
export interface BottomSheetHandleProps {
    animatedIndex?: {
        value: number;
    };
    animatedPosition?: {
        value: number;
    };
}
/**
 * Props for custom backdrop components.
 * Compatible with `@gorhom/bottom-sheet` `BottomSheetBackdropProps`.
 */
export interface BottomSheetBackdropProps {
    animatedIndex?: {
        value: number;
    };
    animatedPosition?: {
        value: number;
    };
    style?: StyleProp<ViewStyle>;
}
/**
 * Props for custom background components.
 * Compatible with `@gorhom/bottom-sheet` `BottomSheetBackgroundProps`.
 */
export interface BottomSheetBackgroundProps {
    animatedIndex?: {
        value: number;
    };
    animatedPosition?: {
        value: number;
    };
    style?: StyleProp<ViewStyle>;
    pointerEvents?: ViewProps['pointerEvents'];
}
/**
 * Props for custom footer components.
 * Compatible with `@gorhom/bottom-sheet` `BottomSheetFooterProps`.
 */
export interface BottomSheetFooterProps {
    animatedFooterPosition?: {
        value: number;
    };
}
/**
 * Props for the `BottomSheet` component.
 * API-compatible with `@gorhom/bottom-sheet` `BottomSheetProps`.
 *
 * @remarks This component uses native platform bottom sheets (SwiftUI on iOS,
 * Material3 ModalBottomSheet on Android, CSS-based on web). Unlike `@gorhom/bottom-sheet`
 * which renders inline at the bottom of its container, this implementation presents
 * a modal sheet overlay on iOS and Android. On web, it renders inline.
 */
export interface BottomSheetProps {
    /**
     * Ref to the bottom sheet component. Exposes imperative methods (`snapToIndex`,
     * `expand`, `collapse`, `close`, `present`, `dismiss`, etc.).
     */
    ref?: Ref<BottomSheetMethods>;
    /**
     * Points for the bottom sheet to snap to, ordered from bottom to top.
     * Accepts pixel values (numbers) or percentage strings (e.g., `'25%'`, `'50%'`).
     *
     * @remarks On Android, only 2 snap states are supported (partial ~50% and expanded).
     * When more than 2 snap points are provided, only the first and last are effective.
     * iOS and web support arbitrary snap points.
     *
     * @example
     * ```tsx
     * snapPoints={['25%', '50%']}
     * snapPoints={[200, 500]}
     * ```
     */
    snapPoints?: (string | number)[];
    /**
     * Initial snap point index. Set to `-1` to start closed.
     * @default 0
     *
     * @remarks For `BottomSheet`, defaults to `0` (open at first snap point), matching
     * `@gorhom/bottom-sheet`. For `BottomSheetModal`, the sheet always starts closed
     * regardless of this value — use `present()` to open. The `index` value then controls
     * which snap point `present()` opens to.
     */
    index?: number;
    /**
     * Callback when the current snap point index changes.
     *
     * @remarks On Android, index values are limited to `0` (partial) and
     * `snapPoints.length - 1` (expanded) due to the 2-state limitation.
     */
    onChange?: (index: number) => void;
    /**
     * Callback when the bottom sheet is fully closed.
     */
    onClose?: () => void;
    /**
     * Callback when the bottom sheet is dismissed.
     * Compatible with `@gorhom/bottom-sheet` `BottomSheetModal.onDismiss`.
     * Alias for `onClose`.
     */
    onDismiss?: () => void;
    /**
     * Whether the sheet can be dismissed by panning down.
     * @default false
     *
     * @remarks On iOS, this enables both swipe-to-dismiss and backdrop tap dismiss —
     * SwiftUI does not allow separating these behaviors. In `@gorhom/bottom-sheet`,
     * only swipe-to-dismiss is controlled (there is no backdrop since the sheet is inline).
     * On Android, this also controls back button and scrim tap dismiss.
     */
    enablePanDownToClose?: boolean;
    /**
     * Whether the sheet should automatically size to fit its content.
     * @default true
     *
     * @remarks Only effective when `snapPoints` is not provided. In `@gorhom/bottom-sheet`,
     * `enableDynamicSizing` prepends a content-sized snap point even when `snapPoints` are
     * provided (e.g., `snapPoints={['25%', '50%']}` becomes `[content-height, 25%, 50%]`).
     * This implementation cannot combine dynamic sizing with explicit snap points — the
     * native iOS `fitToContents` and explicit `presentationDetents` are mutually exclusive.
     * When both `enableDynamicSizing` and `snapPoints` are set, `snapPoints` takes precedence.
     */
    enableDynamicSizing?: boolean;
    /**
     * Whether to animate the sheet from closed to initial snap point on mount.
     * @default true
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets always animate on presentation.
     */
    animateOnMount?: boolean;
    /**
     * Resistance factor when over-dragging the sheet.
     * @default 2.5
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets handle over-drag behavior internally.
     */
    overDragResistanceFactor?: number;
    /**
     * Whether to enable over-dragging the sheet.
     * @default true
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets handle over-drag behavior internally.
     */
    enableOverDrag?: boolean;
    /**
     * Whether to enable content panning gesture.
     * @default true
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets handle content panning internally.
     */
    enableContentPanningGesture?: boolean;
    /**
     * Whether to enable handle panning gesture.
     * @default true
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets handle panning internally.
     */
    enableHandlePanningGesture?: boolean;
    /**
     * Keyboard behavior when the sheet has a text input.
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets handle keyboard behavior automatically.
     */
    keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
    /**
     * Behavior when the keyboard is dismissed.
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets handle keyboard blur behavior automatically.
     */
    keyboardBlurBehavior?: 'none' | 'restore';
    /**
     * Custom handle component. Pass `null` to hide the handle.
     *
     * @remarks On native platforms (iOS and Android), custom handle components are not rendered.
     * Only `null` (hides the native drag indicator) vs any non-null value (shows the default
     * native drag indicator) is distinguished. On web, the default handle is shown or hidden.
     */
    handleComponent?: ComponentType<BottomSheetHandleProps> | null;
    /**
     * Custom backdrop component.
     *
     * @remarks This prop is accepted for API compatibility but has no effect on native platforms.
     * iOS uses a system-provided backdrop. Android provides scrim color control via `backgroundStyle`.
     * On web, the default scrim is always rendered.
     */
    backdropComponent?: ComponentType<BottomSheetBackdropProps>;
    /**
     * Custom background component.
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     * Native sheets render their own background.
     */
    backgroundComponent?: ComponentType<BottomSheetBackgroundProps> | null;
    /**
     * Custom footer component.
     *
     * @remarks This prop is accepted for API compatibility but has no effect.
     */
    footerComponent?: ComponentType<BottomSheetFooterProps>;
    /**
     * Style applied to the bottom sheet container.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Style for the sheet background.
     *
     * @remarks On Android, `backgroundColor` is extracted and applied as `containerColor`.
     * Other style properties may not take effect on native platforms.
     * On web, the full style is applied.
     */
    backgroundStyle?: StyleProp<ViewStyle>;
    /**
     * Style for the handle area.
     *
     * @remarks This prop is accepted for API compatibility but has no effect on native platforms.
     * Native handle styling is controlled by the platform.
     */
    handleStyle?: StyleProp<ViewStyle>;
    /**
     * Style for the handle indicator.
     *
     * @remarks This prop is accepted for API compatibility but has no effect on native platforms.
     * Native handle indicator styling is controlled by the platform.
     */
    handleIndicatorStyle?: StyleProp<ViewStyle>;
    /**
     * Style for the outer container.
     *
     * @remarks This prop is accepted for API compatibility but has no effect on native platforms.
     */
    containerStyle?: StyleProp<ViewStyle>;
    /**
     * The content to render inside the bottom sheet.
     */
    children: ReactNode;
}
/**
 * Props for the `BottomSheetView` component.
 * Compatible with `@gorhom/bottom-sheet` `BottomSheetViewProps`.
 *
 * @remarks In this implementation, `BottomSheetView` is a simple pass-through wrapper.
 * Dynamic sizing is handled by the parent `BottomSheet` component via `enableDynamicSizing`.
 */
export interface BottomSheetViewProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}
/**
 * Parse a gorhom-style snap point into a normalized format.
 * - Numbers are treated as pixel heights.
 * - Strings ending with `%` are treated as fractions of container height.
 */
export declare function parseSnapPoint(point: string | number): {
    type: 'height';
    value: number;
} | {
    type: 'fraction';
    value: number;
};
//# sourceMappingURL=types.d.ts.map