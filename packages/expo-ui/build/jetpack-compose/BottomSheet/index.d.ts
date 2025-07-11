import React from "react";
export type BottomSheetProps = {
    /**
     * The children of the `BottomSheet` component.
     */
    children: React.ReactNode;
    /**
     * Whether the `BottomSheet` is opened.
     */
    isOpened: boolean;
    /**
     * Callback function that is called when the `BottomSheet` is opened.
     */
    onIsOpenedChange: (isOpened: boolean) => void;
    /**
     * Immediately opens the bottom sheet in full screen.
     */
    skipPartiallyExpanded?: boolean;
};
export declare function BottomSheet(props: BottomSheetProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map