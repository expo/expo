import { type CommonViewModifierProps } from '../types';
export type PresentationDetent = 'medium' | 'large' | number;
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
     * Callback function that is called when the `BottomSheet` is dismissed.
     */
    onDismiss?: () => void;
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
} & CommonViewModifierProps;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map