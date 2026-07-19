/**
 * @hidden
 */
export type ViewEvent<Name extends string, Data> = Record<
  Name,
  Data extends object
    ? ((event: { nativeEvent: Data }) => void) | undefined
    : (() => void) | undefined
>;

/**
 * Modifier configuration for native views.
 * This is the JSON Config pattern used by both iOS (SwiftUI) and Android (Jetpack Compose).
 */
export interface ModifierConfig {
  $type: string;
  $scope?: string;
  [key: string]: unknown;
}

/**
 * @deprecated Use ModifierConfig instead. ExpoModifier (SharedRef pattern) has been replaced
 * with JSON Config pattern for better DX and platform consistency.
 */
export type ExpoModifier = ModifierConfig;

/**
 * Properties for the dialog window, matching `DialogProperties` in Compose.
 */
export type DialogProperties = {
  /**
   * Whether the dialog can be dismissed by pressing the back button.
   * @default true
   */
  dismissOnBackPress?: boolean;
  /**
   * Whether the dialog can be dismissed by clicking outside of it.
   * @default true
   */
  dismissOnClickOutside?: boolean;
  /**
   * Whether the dialog should use the platform default width.
   * @default true
   */
  usePlatformDefaultWidth?: boolean;
  /**
   * Whether the dialog's decor fits system windows (status bar, navigation bar, and more).
   * When `true`, the dialog's content will be inset to avoid overlapping with system UI.
   * @default true
   */
  decorFitsSystemWindows?: boolean;
};
