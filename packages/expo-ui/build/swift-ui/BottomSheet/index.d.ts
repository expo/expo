import { type CommonViewModifierProps } from '../types';
export type PresentationDetent = 'medium' | 'large' | number;
export type PresentationDragIndicatorVisibility = 'automatic' | 'visible' | 'hidden';
export type BottomSheetProps = {
    /**
     * The children of the `BottomSheet` component.
     */
    children: any;
    /**
     * Whether the `BottomSheet` is opened.
     */
    isOpened: boolean;
    /**
     * Callback function that is called when the `BottomSheet` is opened.
     */
    onIsOpenedChange: (isOpened: boolean) => void;
    /**
     * Setting it to `true` will disable the interactive dismiss of the `BottomSheet`.
     */
    interactiveDismissDisabled?: boolean;
    /**
     * Array of presentation detents for the `BottomSheet`.
     * Controls the heights that the sheet can snap to.
     * - `medium` - Medium height sheet
     * - `large` - Full height sheet
     * - number (0-1) - Fraction of screen height (for example, 0.4 equals to 40% of screen)
     */
    presentationDetents?: PresentationDetent[];
    /**
     * Controls the visibility of the drag indicator for the `BottomSheet`.
     * - `automatic` - System decides based on context (default)
     * - `visible` - Always show the drag indicator
     * - `hidden` - Never show the drag indicator
     */
    presentationDragIndicator?: PresentationDragIndicatorVisibility;
    /**
     * When set to `true`, automatically adds the children's height as a detent.
     * This allows the sheet to have a snap point that perfectly fits the content.
     * @default false
     */
    includeChildrenHeightDetent?: boolean;
} & CommonViewModifierProps;
export declare function BottomSheet(props: BottomSheetProps): any;
//# sourceMappingURL=index.d.ts.map