import { NativeSyntheticEvent } from 'react-native';
import { BottomSheetProps } from '.';
type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsOpenedChange'> & {
    onIsOpenedChange: (event: NativeSyntheticEvent<{
        isOpened: boolean;
    }>) => void;
};
export declare function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps;
export declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.ios.d.ts.map