import { requireNativeView } from 'expo';
import type { ReactNode } from 'react';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

const NativeView: React.ComponentType<ExposedDropdownMenuProps> = requireNativeView(
  'ExpoUI',
  'ExposedDropdownMenuView'
);

/**
 * Props for the `ExposedDropdownMenu` component.
 */
export type ExposedDropdownMenuProps = {
  /**
   * Whether the dropdown menu is expanded (visible).
   */
  expanded: boolean;
  /**
   * Callback fired when the menu requests to be dismissed (e.g. tapping outside, back button).
   */
  onDismissRequest?: () => void;
  /**
   * Background color of the dropdown menu container.
   */
  containerColor?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children should be `DropdownMenuItem` components.
   */
  children?: ReactNode;
};

/**
 * A Material 3 `ExposedDropdownMenu` that displays menu items in a dropdown.
 *
 * Must be used inside an `ExposedDropdownMenuBox`.
 */
export function ExposedDropdownMenu(props: ExposedDropdownMenuProps) {
  const { modifiers, children, ...restProps } = props;
  return (
    <NativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </NativeView>
  );
}
