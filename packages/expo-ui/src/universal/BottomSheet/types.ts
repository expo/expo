import type { ColorValue } from 'react-native';

import type { ModifierConfig } from '../../types';

/**
 * A snap point describing one of the heights a [`BottomSheet`](#bottomsheet) can rest at.
 *
 * - `'half'` — Approximately half-screen.
 * - `'full'` — Fully expanded.
 * - `{ fraction }` — A fraction of the screen height (0–1).
 *   iOS / web only.
 * - `{ height }` — A fixed pixel height.
 *   iOS / web only.
 *
 * On Android, `{ fraction }` and `{ height }` snap to the nearest of `'half'` / `'full'`.
 * See the component docs for platform behavior notes.
 */
export type SnapPoint = 'half' | 'full' | { fraction: number } | { height: number };

/**
 * Padding between a [`BottomSheet`](#bottomsheet) and its content — a single value applied to every
 * edge, or per-edge values where an edge that is left out is `0`.
 */
export type BottomSheetContentPadding =
  | number
  | {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };

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
   * Heights the sheet can rest at.
   * When omitted, the sheet auto-sizes to its content.
   * See [`SnapPoint`](#snappoint) for the supported values.
   *
   * @example `['half', 'full']` — draggable between half and full
   * @example `['full']` — always full height
   */
  snapPoints?: SnapPoint[];

  /**
   * Padding between the sheet and [`children`](#children), in dp on Android, points on iOS, and
   * CSS pixels on web. Pass `0` for content that reaches the sheet's edges.
   *
   * When omitted, each platform keeps the inset it applies by default.
   *
   * @example `contentPadding={0}` — full-bleed content
   * @example `contentPadding={{ top: 8, bottom: 24 }}` — no horizontal inset
   */
  contentPadding?: BottomSheetContentPadding;

  /**
   * Identifier used to locate the component in end-to-end tests.
   */
  testID?: string;

  /**
   * Whether pressing the Android hardware back button (or back gesture) dismisses the bottom sheet.
   * When `false`, the back press does not dismiss the sheet (note: the press still does not reach
   * React Native's `BackHandler`).
   * @default true
   * @platform android
   */
  shouldDismissOnBackPress?: boolean;

  /**
   * Whether tapping the backdrop (scrim) dismisses the bottom sheet.
   * When `false`, the sheet stays open until the user explicitly closes it (e.g. via a button).
   * @default true
   * @platform android
   */
  shouldDismissOnClickOutside?: boolean;

  /**
   * The color of the scrim overlay rendered behind the bottom sheet.
   * Pass `'transparent'` to make the backdrop invisible while still blocking touches.
   * @platform android
   */
  scrimColor?: ColorValue;

  /**
   * Platform-specific modifier escape hatch. Pass an array of modifier configs
   * from `@expo/ui/swift-ui/modifiers` or `@expo/ui/jetpack-compose/modifiers`.
   */
  modifiers?: ModifierConfig[];

  /**
   * The sheet's own background color, painting its full chrome (including the
   * drag-indicator zone and, on iOS, the home-indicator safe-area inset).
   * When omitted, each platform keeps its own default.
   *
   * This only paints the background. `children` are React Native views on
   * every platform, so they don't pick up a contrasting text color
   * automatically -- set one explicitly if you use a dark `containerColor`.
   * @platform android
   * @platform ios 16.4+
   * @platform web
   */
  containerColor?: ColorValue;

  /**
   * The preferred color for native Compose content that doesn't set its own
   * color. Doesn't reach a `BottomSheet`'s (React Native) `children` -- see
   * `containerColor`'s doc.
   * @platform android
   */
  contentColor?: ColorValue;
}
