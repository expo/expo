import { requireNativeView } from 'expo';
import { useState, type ComponentType, type ReactNode } from 'react';
import { type NativeSyntheticEvent } from 'react-native';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface BottomSheetProps extends CommonViewModifierProps {
  /**
   * The sheet's content, mounted while presented and unmounted after dismiss. Wrap it in `Group`
   * to apply presentation modifiers.
   */
  children: ReactNode;
  /**
   * A view the sheet is anchored to, for example the `Button` that opens it. Rendered in place and
   * kept mounted, so presenting the sheet doesn't shift surrounding layout. Optional.
   */
  anchor?: ReactNode;
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
}

type NativeBottomSheetProps = Omit<
  BottomSheetProps,
  'onIsPresentedChange' | 'onDismiss' | 'anchor'
> & {
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
  const { modifiers, onIsPresentedChange, onDismiss, anchor, children, ...restProps } = props;
  const [isMounted, setIsMounted] = useState(props.isPresented);

  if (props.isPresented && !isMounted) {
    setIsMounted(true);
  }

  // The anchor stays mounted so it's always visible; the content mounts on present and unmounts
  // after dismiss.
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
      }}>
      {anchor != null ? <Slot name="anchor">{anchor}</Slot> : null}
      {isMounted ? children : null}
    </BottomSheetNativeView>
  );
}

export { BottomSheet };
