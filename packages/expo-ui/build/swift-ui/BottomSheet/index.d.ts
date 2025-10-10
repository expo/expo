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
     * - 'medium': Medium height sheet
     * - 'large': Full height sheet
     * - number (0-1): Fraction of screen height (e.g. 0.4 = 40% of screen)
     */
    presentationDetents?: PresentationDetent[];
    /**
     * Controls the visibility of the drag indicator for the `BottomSheet`.
     * - 'automatic': System decides based on context (default)
     * - 'visible': Always show the drag indicator
     * - 'hidden': Never show the drag indicator
     */
    presentationDragIndicator?: PresentationDragIndicatorVisibility;
    /**
     * The largest detent where the background remains undimmed/interactive.
     * Background will be dimmed only at larger detents than this value.
     *
     * Use a number matching your detent values (e.g., 0.1, 0.4, 0.5 for medium, 1.0 for large).
     *
     * If both `largestUndimmedDetent` and `largestUndimmedDetentIndex` are provided,
     * `largestUndimmedDetent` takes precedence.
     *
     * @requires iOS 16.4+
     * @example
     * // Keep background interactive at 0.1 and 0.4, dim only at 'large'
     * <BottomSheet
     *   presentationDetents={[0.1, 0.4, 'large']}
     *   largestUndimmedDetent={0.4}
     * />
     */
    largestUndimmedDetent?: number;
    /**
     * Index of the largest detent where background remains undimmed/interactive.
     * Background will be dimmed only at larger detents than the one at this index.
     *
     * Alternative to `largestUndimmedDetent` when you want to reference by position
     * in the `presentationDetents` array.
     *
     * If both `largestUndimmedDetent` and `largestUndimmedDetentIndex` are provided,
     * `largestUndimmedDetent` takes precedence.
     *
     * @requires iOS 16.4+
     * @example
     * // Keep background interactive at index 0 and 1, dim only at index 2
     * <BottomSheet
     *   presentationDetents={[0.1, 0.4, 'large']}
     *   largestUndimmedDetentIndex={1}
     * />
     */
    largestUndimmedDetentIndex?: number;
} & CommonViewModifierProps;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map