import React from 'react';
import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
export type ModalBottomSheetProperties = {
    /**
     * Whether the bottom sheet can be dismissed by pressing the back button.
     * @default true
     */
    shouldDismissOnBackPress?: boolean;
    /**
     * Whether the bottom sheet can be dismissed by clicking outside (on the scrim).
     * @default true
     */
    shouldDismissOnClickOutside?: boolean;
};
export type ModalBottomSheetProps = {
    /**
     * The children of the `ModalBottomSheet` component.
     * Can include a `ModalBottomSheet.DragHandle` slot for a custom drag handle.
     */
    children: React.ReactNode;
    /**
     * Whether the `ModalBottomSheet` is presented.
     */
    isPresented: boolean;
    /**
     * Callback function that is called when the presentation state changes.
     * The sheet animates its dismiss before calling this with `false`.
     */
    onIsPresentedChange: (isPresented: boolean) => void;
    /**
     * Immediately opens the bottom sheet in full screen.
     * @default false
     */
    skipPartiallyExpanded?: boolean;
    /**
     * The background color of the bottom sheet.
     */
    containerColor?: ColorValue;
    /**
     * The preferred color of the content inside the bottom sheet.
     */
    contentColor?: ColorValue;
    /**
     * The color of the scrim overlay behind the bottom sheet.
     */
    scrimColor?: ColorValue;
    /**
     * Whether to show the default drag handle at the top of the bottom sheet.
     * Ignored if a custom `ModalBottomSheet.DragHandle` slot is provided.
     * @default true
     */
    showDragHandle?: boolean;
    /**
     * Whether gestures (swipe to dismiss) are enabled on the bottom sheet.
     * @default true
     */
    sheetGesturesEnabled?: boolean;
    /**
     * Properties for the modal window behavior.
     */
    properties?: ModalBottomSheetProperties;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A Material Design modal bottom sheet.
 */
declare function ModalBottomSheetComponent(props: ModalBottomSheetProps): React.JSX.Element;
declare namespace ModalBottomSheetComponent {
    var DragHandle: (props: {
        children: React.ReactNode;
    }) => React.JSX.Element;
}
export declare const ModalBottomSheet: typeof ModalBottomSheetComponent;
/**
 * @deprecated Use `ModalBottomSheet` instead.
 */
export declare const BottomSheet: typeof ModalBottomSheetComponent;
/**
 * @deprecated Use `ModalBottomSheetProps` instead.
 */
export type BottomSheetProps = ModalBottomSheetProps;
export {};
//# sourceMappingURL=index.d.ts.map