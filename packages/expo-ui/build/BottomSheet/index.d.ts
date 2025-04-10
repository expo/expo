import { StyleProp, ViewStyle } from 'react-native';
export type BottomSheetProps = {
    /**
     * Optional styles to apply to the `BottomSheet` component.
     */
    style?: StyleProp<ViewStyle>;
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
};
/**
 * Renders a native `BottomSheet` component.
 * @platform ios
 */
export declare function BottomSheet({ children }: BottomSheetProps): any;
//# sourceMappingURL=index.d.ts.map