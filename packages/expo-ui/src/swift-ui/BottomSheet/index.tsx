import { requireNativeView } from 'expo';
import { ComponentType } from 'react';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type BottomSheetProps = {
  /**
   * The children of the `BottomSheet` component.
   * Use `BottomSheet.Content` to wrap your content and apply presentation modifiers
   * like `presentationDetents`, `presentationDragIndicator`,
   * `presentationBackgroundInteraction`, and `interactiveDismissDisabled`.
   */
  children: any;
  /**
   * Whether the `BottomSheet` is presented.
   */
  isPresented: boolean;
  /**
   * Callback function that is called when the `BottomSheet` presented state changes.
   */
  onIsPresentedChange: (isPresented: boolean) => void;
  /**
   * When `true`, the sheet will automatically size itself to fit its content.
   * This sets the presentation detent to match the height of the children.
   * @default false
   */
  fitToContents?: boolean;
} & CommonViewModifierProps;

export type BottomSheetContentProps = {
  /**
   * The content to display inside the bottom sheet.
   */
  children: React.ReactNode;
} & CommonViewModifierProps;

type NativeBottomSheetProps = Omit<BottomSheetProps, 'onIsPresentedChange'> & {
  onIsPresentedChange: (event: NativeSyntheticEvent<{ isPresented: boolean }>) => void;
};

const BottomSheetNativeView: ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

const BottomSheetContentNativeView: ComponentType<BottomSheetContentProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetContentView'
);

function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onIsPresentedChange: ({ nativeEvent: { isPresented } }) => {
      props?.onIsPresentedChange?.(isPresented);
    },
  };
}

/**
 * Content container for the bottom sheet that supports presentation modifiers.
 * Use this to apply modifiers like `presentationDetents`, `presentationDragIndicator`,
 * `presentationBackgroundInteraction`, and `interactiveDismissDisabled`.
 */
function Content(props: BottomSheetContentProps) {
  const { modifiers, ...restProps } = props;
  return (
    <BottomSheetContentNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

/**
 * `BottomSheet` presents content from the bottom of the screen.
 */
function BottomSheet(props: BottomSheetProps) {
  return <BottomSheetNativeView {...transformBottomSheetProps(props)} />;
}

BottomSheet.Content = Content;

export { BottomSheet };
