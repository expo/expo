import { requireNativeView } from 'expo';
import { Dimensions, NativeSyntheticEvent } from 'react-native';

import { Host } from '../Host';

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

/**
 * `<BottomSheet>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function BottomSheetPrimitive(props: BottomSheetProps) {
  return <BottomSheetNativeView {...transformBottomSheetProps(props)} />;
}

export function BottomSheet(props: BottomSheetProps) {
  const { width } = Dimensions.get('window');
  return (
    <Host style={{ position: 'absolute', width }}>
      <BottomSheetPrimitive {...props} />
    </Host>
  );
}
