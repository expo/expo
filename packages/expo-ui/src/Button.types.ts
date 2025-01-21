import type { StyleProp, ViewStyle } from 'react-native';

/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 * @platform ios
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';

/*
 * The built-in button styles available on iOS and Android.
 * Common styles:
 * - `default` - The default system button style.
 * - `bordered` - A button with a light fill. On Android equivalent to `FilledTonalButton`.
 * - `borderless` - A button with no background or border. On Android equivalent to `TextButton`.
 * Apple-only styles:
 * - `borderedProminent` - A bordered button with a prominent appearance.
 * - `plain` - A button with no border or background and a less prominent text.
 * MacOS-only styles:
 * - `accessoryBar` - A button style for accessory bars.
 * - `accessoryBarAction` - A button style for accessory bar actions.
 * - `card` - A button style for cards.
 * - `link` - A button style for links.
 * Android-only styles:
 * - `outlined` - A button with an outline.
 * - `elevated` - A filled button with a shadow.
 *
 * @platform android
 * @platform ios
 */
export type ButtonStyle =
  // Common
  | 'default'
  | 'bordered'
  | 'plain'
  // Apple-only
  | 'borderedProminent'
  | 'borderless'
  // MacOS-only;
  | 'accessoryBar'
  | 'accessoryBarAction'
  | 'card'
  | 'link'
  // Android-only;
  | 'outlined'
  | 'elevated';

export type ButtonProps = {
  /**
   * The text to display inside the button.
   */
  text: string;
  /**
   * A callback that is called when the button is pressed.
   */
  onButtonPressed?: () => void;
  /**
   * A string describing the system image to display in the button.
   * @platform ios
   */
  systemImage?: string;
  /**
   * Indicated the role of the button.
   * @platform ios
   */
  buttonRole?: ButtonRole;
  /**
   * The button variant.
   */
  buttonStyle?: ButtonStyle;
  /**
   * Additional styles to apply to the button.
   */
  style?: StyleProp<ViewStyle>;
};
