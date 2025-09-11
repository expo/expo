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
} & CommonViewModifierProps;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map