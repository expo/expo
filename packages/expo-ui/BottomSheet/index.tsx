import { StyleProp, ViewStyle } from 'react-native';

export type BottomSheetProps = {
  style?: StyleProp<ViewStyle>;
  children: any;
  isOpened: boolean;
  onIsOpenedChange: (isOpened: boolean) => void;
};

export function BottomSheet({ children }: BottomSheetProps) {
  return children;
}
