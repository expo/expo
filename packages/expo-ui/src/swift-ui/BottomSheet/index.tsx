import { requireNativeView } from 'expo';
import { Dimensions, NativeSyntheticEvent, StyleProp, View, ViewStyle } from 'react-native';

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
  onIsOpenedChange: (event: NativeSyntheticEvent<{ isOpened: boolean }>) => void;
};

const BottomSheetNativeView: React.ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

export function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps {
  return {
    ...props,
    onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
      props?.onIsOpenedChange?.(isOpened);
    },
  };
}

export function BottomSheet(props: BottomSheetProps) {
  const { width } = Dimensions.get('window');
  return (
    <View>
      <BottomSheetNativeView
        style={{ position: 'absolute', width }}
        {...transformBottomSheetProps(props)}
      />
    </View>
  );
}
