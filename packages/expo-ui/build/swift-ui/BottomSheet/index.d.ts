import { NativeSyntheticEvent } from 'react-native';
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
};
type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsOpenedChange'> & {
    onIsOpenedChange: (event: NativeSyntheticEvent<{
        isOpened: boolean;
    }>) => void;
};
export declare function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps;
/**
 * `<BottomSheet>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function BottomSheetPrimitive(props: BottomSheetProps): import("react").JSX.Element;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map