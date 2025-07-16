import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';
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

type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsOpenedChange'> & {
  onIsOpenedChange: (event: NativeSyntheticEvent<{ isOpened: boolean }>) => void;
  skipPartiallyExpanded: boolean;
};

const BottomSheetNativeView: React.ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps {
  return {
    ...props,
    skipPartiallyExpanded: props.skipPartiallyExpanded ?? false,
    onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
      props.onIsOpenedChange(isOpened);
    },
  };
}

export function BottomSheet(props: BottomSheetProps) {
  return <BottomSheetNativeView {...transformBottomSheetProps(props)} />;
}
