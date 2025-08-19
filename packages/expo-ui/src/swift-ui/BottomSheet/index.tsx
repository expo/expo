import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

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
} & CommonViewModifierProps;

type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsOpenedChange'> & {
  onIsOpenedChange: (event: NativeSyntheticEvent<{ isOpened: boolean }>) => void;
};

const BottomSheetNativeView: React.ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
      props?.onIsOpenedChange?.(isOpened);
    },
  };
}

export function BottomSheet(props: BottomSheetProps) {
  return <BottomSheetNativeView {...transformBottomSheetProps(props)} />;
}
