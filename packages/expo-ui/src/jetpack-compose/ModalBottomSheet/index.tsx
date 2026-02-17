import { requireNativeView } from 'expo';
import React from 'react';

import { type ExpoModifier, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type ModalBottomSheetProps = {
  /**
   * The children of the `ModalBottomSheet` component.
   */
  children: React.ReactNode;
  /**
   * Callback function that is called when the bottom sheet is dismissed.
   */
  onDismissRequest: () => void;
  /**
   * Immediately opens the bottom sheet in full screen.
   * @default false
   */
  skipPartiallyExpanded?: boolean;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeModalBottomSheetProps = Omit<ModalBottomSheetProps, 'onDismissRequest'> &
  ViewEvent<'onDismissRequest', void>;

const ModalBottomSheetNativeView: React.ComponentType<NativeModalBottomSheetProps> =
  requireNativeView('ExpoUI', 'ModalBottomSheetView');

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
 * A Material Design modal bottom sheet.
 */
export function ModalBottomSheet(props: ModalBottomSheetProps) {
  return <ModalBottomSheetNativeView {...transformProps(props)} />;
}

/**
 * @deprecated Use `ModalBottomSheet` instead.
 */
export const BottomSheet = ModalBottomSheet;

/**
 * @deprecated Use `ModalBottomSheetProps` instead.
 */
export type BottomSheetProps = ModalBottomSheetProps;
