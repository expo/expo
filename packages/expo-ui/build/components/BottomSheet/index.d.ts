import { StyleProp, ViewStyle } from 'react-native';
export type BottomSheetProps = {
    style?: StyleProp<ViewStyle>;
    children: any;
    isOpened: boolean;
    onIsOpenedChange: (isOpened: boolean) => void;
};
export declare function BottomSheet({ children }: BottomSheetProps): any;
//# sourceMappingURL=index.d.ts.map