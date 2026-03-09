import React from 'react';
import { type ExpoModifier } from '../../types';
export type ModalBottomSheetProps = {
    /**
     * The children of the `ModalBottomSheet` component.
     */
    children: React.ReactNode;
    /**
     * Callback function that is called when the bottom sheet is dismissed.
     */
    onDismissRequest: () => void;
    /**
     * Immediately opens the bottom sheet in full screen.
     * @default false
     */
    skipPartiallyExpanded?: boolean;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A Material Design modal bottom sheet.
 */
export declare function ModalBottomSheet(props: ModalBottomSheetProps): React.JSX.Element;
/**
 * @deprecated Use `ModalBottomSheet` instead.
 */
export declare const BottomSheet: typeof ModalBottomSheet;
/**
 * @deprecated Use `ModalBottomSheetProps` instead.
 */
export type BottomSheetProps = ModalBottomSheetProps;
//# sourceMappingURL=index.d.ts.map