import { requireNativeView } from 'expo';
import React from 'react';
import { type ColorValue, type NativeSyntheticEvent } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type SlotNativeViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SlotNativeView: React.ComponentType<SlotNativeViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

export type ModalBottomSheetProperties = {
  /**
   * Whether the bottom sheet can be dismissed by pressing the back button.
   * @default true
   */
  shouldDismissOnBackPress?: boolean;
  /**
   * Whether the bottom sheet can be dismissed by clicking outside (on the scrim).
   * @default true
   */
  shouldDismissOnClickOutside?: boolean;
};

export type ModalBottomSheetProps = {
  /**
   * The children of the `ModalBottomSheet` component.
   * Can include a `ModalBottomSheet.DragHandle` slot for a custom drag handle.
   */
  children: React.ReactNode;
  /**
   * Whether the `ModalBottomSheet` is presented.
   */
  isPresented: boolean;
  /**
   * Callback function that is called when the presentation state changes.
   * The sheet animates its dismiss before calling this with `false`.
   */
  onIsPresentedChange: (isPresented: boolean) => void;
  /**
   * Immediately opens the bottom sheet in full screen.
   * @default false
   */
  skipPartiallyExpanded?: boolean;
  /**
   * The background color of the bottom sheet.
   */
  containerColor?: ColorValue;
  /**
   * The preferred color of the content inside the bottom sheet.
   */
  contentColor?: ColorValue;
  /**
   * The color of the scrim overlay behind the bottom sheet.
   */
  scrimColor?: ColorValue;
  /**
   * Whether to show the default drag handle at the top of the bottom sheet.
   * Ignored if a custom `ModalBottomSheet.DragHandle` slot is provided.
   * @default true
   */
  showDragHandle?: boolean;
  /**
   * Whether gestures (swipe to dismiss) are enabled on the bottom sheet.
   * @default true
   */
  sheetGesturesEnabled?: boolean;
  /**
   * Callback function that is called when the user dismisses the bottom sheet
   * (via swipe, back press, or tapping outside the scrim).
   */
  onDismissRequest?: () => void;
  /**
   * Properties for the modal window behavior.
   */
  properties?: ModalBottomSheetProperties;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeModalBottomSheetProps = Omit<
  ModalBottomSheetProps,
  'onIsPresentedChange' | 'onDismissRequest'
> & {
  onIsPresentedChange: (event: NativeSyntheticEvent<{ value: boolean }>) => void;
  onDismissRequest?: () => void;
};

const ModalBottomSheetNativeView: React.ComponentType<NativeModalBottomSheetProps> =
  requireNativeView('ExpoUI', 'ModalBottomSheetView');

function transformProps(props: ModalBottomSheetProps): NativeModalBottomSheetProps {
  const { modifiers, onIsPresentedChange, onDismissRequest, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    skipPartiallyExpanded: props.skipPartiallyExpanded ?? false,
    onIsPresentedChange: ({ nativeEvent: { value } }) => {
      onIsPresentedChange?.(value);
    },
    onDismissRequest: onDismissRequest
      ? () => {
          onDismissRequest();
        }
      : undefined,
  };
}

/**
 * A custom drag handle slot for `ModalBottomSheet`.
 * Wrap any content to use as the sheet's drag handle.
 *
 * @platform android
 */
function DragHandle(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="dragHandle">{props.children}</SlotNativeView>;
}

/**
 * A Material Design modal bottom sheet.
 */
function ModalBottomSheetComponent(props: ModalBottomSheetProps) {
  return <ModalBottomSheetNativeView {...transformProps(props)} />;
}

ModalBottomSheetComponent.DragHandle = DragHandle;

export const ModalBottomSheet = ModalBottomSheetComponent;

/**
 * @deprecated Use `ModalBottomSheet` instead.
 */
export const BottomSheet = ModalBottomSheet;

/**
 * @deprecated Use `ModalBottomSheetProps` instead.
 */
export type BottomSheetProps = ModalBottomSheetProps;
