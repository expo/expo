import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
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
type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsOpenedChange'> & {
    onIsOpenedChange: (event: NativeSyntheticEvent<{
        isOpened: boolean;
    }>) => void;
};
export declare function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map