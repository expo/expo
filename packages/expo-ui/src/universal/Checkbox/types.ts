import type { Ref } from 'react';

import type { ModifierConfig } from '../../types';

/**
 * Props for the [`Checkbox`](#checkbox) component.
 */
export interface CheckboxProps {
  /**
   * Whether the checkbox is checked.
   */
  value: boolean;

  /**
   * Called when the user toggles the checkbox.
   */
  onValueChange: (value: boolean) => void;

  /**
   * Text label displayed alongside the checkbox.
   */
  label?: string;

  /**
   * Whether the checkbox is disabled. Disabled checkboxes do not respond to user interaction.
   */
  disabled?: boolean;

  /**
   * Identifier used to locate the component in end-to-end tests.
   */
  testID?: string;

  /**
   * Platform-specific modifier escape hatch. Pass an array of modifier configs
   * from `@expo/ui/swift-ui/modifiers` or `@expo/ui/jetpack-compose/modifiers`.
   */
  modifiers?: ModifierConfig[];

  /**
   * Forwarded to the underlying native view: the SwiftUI view on iOS, the Jetpack
   * Compose view on Android, or the rendered React Native element on web. An escape
   * hatch for advanced cases that need the native handle; not part of the public API.
   * @hidden
   */
  ref?: Ref<any>;
}
