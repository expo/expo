import type { ModifierConfig } from '../../types';

/**
 * Props for the [`Slider`](#slider) component.
 */
export interface SliderProps {
  /**
   * Current value of the slider.
   */
  value: number;

  /**
   * Called when the user changes the slider value.
   */
  onValueChange: (value: number) => void;

  /**
   * Minimum value of the slider range.
   * @default 0
   */
  min?: number;

  /**
   * Maximum value of the slider range.
   * @default 1
   */
  max?: number;

  /**
   * Increment size. For example, `step={10}` with `min={0}` and `max={100}` produces values `0, 10, 20, …, 100`.
   */
  step?: number;

  /**
   * Whether the slider is disabled. Disabled sliders do not respond to user interaction.
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
