import { requireNativeView } from 'expo';
import { useState, type ComponentType } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type BottomSheetProps = {
  /**
   * The children of the `BottomSheet` component.
   * Use `Group` to wrap your content and apply presentation modifiers
   * like `presentationDetents`, `presentationDragIndicator`,
   * `presentationBackgroundInteraction`, and `interactiveDismissDisabled`.
   */
  children: React.ReactNode;
  /**
   * Whether the `BottomSheet` is presented.
   */
  isPresented: boolean;
  /**
   * Callback function that is called when the `BottomSheet` presented state changes.
   */
  onIsPresentedChange: (isPresented: boolean) => void;
  /**
   * Callback function that is called after the `BottomSheet` has been fully dismissed.
   */
  onDismiss?: () => void;
  /**
   * When `true`, the sheet will automatically size itself to fit its content.
   * This sets the presentation detent to match the height of the children.
   * @default false
   */
  fitToContents?: boolean;
} & CommonViewModifierProps;

type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsPresentedChange' | 'onDismiss'> & {
  onIsPresentedChange: (event: NativeSyntheticEvent<{ isPresented: boolean }>) => void;
  onDismiss: (event: NativeSyntheticEvent<object>) => void;
};

const BottomSheetNativeView: ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

/**
 * `BottomSheet` presents content from the bottom of the screen.
 */
function BottomSheet(props: BottomSheetProps) {
  const { modifiers, onIsPresentedChange, onDismiss, ...restProps } = props;
  const [isMounted, setIsMounted] = useState(props.isPresented);

  if (props.isPresented && !isMounted) {
    setIsMounted(true);
  }

  if (!isMounted) {
    return null;
  }

  return (
    <BottomSheetNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onIsPresentedChange={({ nativeEvent: { isPresented } }) => {
        onIsPresentedChange?.(isPresented);
      }}
      onDismiss={() => {
        setIsMounted(false);
        onDismiss?.();
      }}
    />
  );
}

export { BottomSheet };
