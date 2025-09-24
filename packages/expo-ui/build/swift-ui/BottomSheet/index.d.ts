import { type CommonViewModifierProps } from '../types';
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
} & CommonViewModifierProps;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map