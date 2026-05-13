import type { ModifierConfig } from '../../types';

/**
 * Props for the [`BottomSheet`](#bottomsheet) component, a modal sheet that slides up from the bottom of the screen.
 */
export interface BottomSheetProps {
  /**
   * Content to render inside the bottom sheet.
   */
  children?: React.ReactNode;

  /**
   * Whether the bottom sheet is currently visible.
   */
  isPresented: boolean;

  /**
   * Called when the bottom sheet is dismissed by the user (e.g. swiping down or tapping the overlay).
   */
  onDismiss: () => void;

  /**
   * Whether to show a drag indicator at the top of the sheet.
   * @default true
   */
  showDragIndicator?: boolean;

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
