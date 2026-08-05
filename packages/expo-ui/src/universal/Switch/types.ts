import type { ModifierConfig } from '../../types';

/**
 * Props for the [`Switch`](#switch) component, a toggle control.
 */
export interface SwitchProps {
  /**
   * Whether the switch is on.
   */
  value: boolean;

  /**
   * Called when the user toggles the switch.
   */
  onValueChange: (value: boolean) => void;

  /**
   * Text label displayed alongside the switch.
   */
  label?: string;

  /**
   * Whether the switch is disabled. Disabled switches do not respond to user interaction.
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
}
