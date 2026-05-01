import { requireNativeView } from 'expo';
import type { Ref, ReactNode, ComponentType } from 'react';
import type { ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type SlotNativeViewProps = {
  slotName: string;
  children: ReactNode;
};

const SlotNativeView: ComponentType<SlotNativeViewProps> = requireNativeView('ExpoUI', 'SlotView');

export type ModalBottomSheetRef = {
  /**
   * Programmatically hides the bottom sheet with an animation.
   * The returned promise resolves after the dismiss animation completes.
   */
  hide: () => Promise<void>;
  /**
   * Programmatically expands the bottom sheet to full height with an animation.
   */
  expand: () => Promise<void>;
  /**
   * Programmatically collapses the bottom sheet to partially expanded (~50%) state.
   * Only works when `skipPartiallyExpanded` is `false`.
   */
  partialExpand: () => Promise<void>;
};

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
  children: ReactNode;
  /**
   * Can be used to imperatively hide the bottom sheet with an animation.
   */
  ref?: Ref<ModalBottomSheetRef>;
  /**
   * Callback function that is called when the user dismisses the bottom sheet
   * (via swipe, back press, or tapping outside the scrim).
   */
  onDismissRequest: () => void;
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
   * Properties for the modal window behavior.
   */
  properties?: ModalBottomSheetProperties;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeModalBottomSheetProps = Omit<ModalBottomSheetProps, 'onDismissRequest'> & {
  onDismissRequest: () => void;
};

const ModalBottomSheetNativeView: ComponentType<NativeModalBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'ModalBottomSheetView'
);

function transformProps(props: ModalBottomSheetProps): NativeModalBottomSheetProps {
  const { modifiers, onDismissRequest, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    skipPartiallyExpanded: props.skipPartiallyExpanded ?? false,
    onDismissRequest: () => {
      onDismissRequest?.();
    },
  };
}

/**
 * A custom drag handle slot for `ModalBottomSheet`.
 * Wrap any content to use as the sheet's drag handle.
 *
 * @platform android
 */
function DragHandle(props: { children: ReactNode }) {
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
