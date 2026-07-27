import {
  createModifier,
  createModifierWithEventListener,
  type ModifierConfig,
} from './createModifier';

/**
 * Presentation detent type for controlling sheet heights.
 * - `'medium'`: System medium height (approximately half screen)
 * - `'large'`: System large height (full screen)
 * - `{ fraction: number }`: Fraction of screen height (0-1, for example, 0.4 equals 40% of screen)
 * - `{ height: number }`: Fixed height in points
 */
export type PresentationDetent = 'medium' | 'large' | { fraction: number } | { height: number };

/**
 * Sets the available heights for a sheet presentation.
 * @param detents - Array of detents the sheet can snap to.
 * @param options - Optional settings for tracking the selected detent.
 * @param options.selection - The currently selected detent.
 * @param options.onSelectionChange - Callback fired when the user changes the active detent by dragging.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationdetents(_:selection:)).
 */
export const presentationDetents = (
  detents: PresentationDetent[],
  options?: {
    selection?: PresentationDetent;
    onSelectionChange?: (detent: PresentationDetent) => void;
  }
): ModifierConfig => {
  const params = { detents, selection: options?.selection };

  const { onSelectionChange } = options ?? {};
  if (onSelectionChange) {
    return createModifierWithEventListener(
      'presentationDetents',
      (args: { detent: PresentationDetent }) => {
        onSelectionChange(args.detent);
      },
      params
    );
  }

  return createModifier('presentationDetents', params);
};

/**
 * Controls the visibility of the drag indicator on a sheet.
 * @param visibility - The visibility of the drag indicator.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationdragindicator(_:)).
 */
export const presentationDragIndicator = (visibility: 'automatic' | 'visible' | 'hidden') =>
  createModifier('presentationDragIndicator', { visibility });

/**
 * Presentation background interaction type.
 */
export type PresentationBackgroundInteractionType =
  | 'automatic'
  | 'enabled'
  | 'disabled'
  | { type: 'enabledUpThrough'; detent: PresentationDetent };

/**
 * Controls interaction with the content behind a sheet.
 * @param interaction - The background interaction behavior.
 * @platform ios 16.4+
 * @platform tvos 16.4+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationbackgroundinteraction(_:)).
 */
export const presentationBackgroundInteraction = (
  interaction: PresentationBackgroundInteractionType
) => {
  if (typeof interaction === 'string') {
    return createModifier('presentationBackgroundInteraction', { interactionType: interaction });
  }
  return createModifier('presentationBackgroundInteraction', {
    interactionType: 'enabledUpThrough',
    detent: interaction.detent,
  });
};

/**
 * Sets the background of a sheet presentation. Paints the entire sheet chrome
 * including the drag-indicator zone and home-indicator safe-area inset, which
 * a regular `background()` modifier cannot reach.
 * @param color - The background color (hex string). For example, `#FF0000`.
 * @platform ios 16.4+
 * @see Official [SwiftUI
documentation](https://developer.apple.com/documentation/swiftui/view/presentationbackground(_:)).
 */
export const presentationBackground = (color: string) =>
  createModifier('presentationBackground', { color });

/**
 * Disables interactive dismissal of a sheet.
 * @param isDisabled - Whether interactive dismiss is disabled (default: true).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/interactivedismissdisabled(_:)).
 */
export const interactiveDismissDisabled = (isDisabled: boolean = true) =>
  createModifier('interactiveDismissDisabled', { isDisabled });

/**
 * Sizing behavior for a sheet presentation.
 * - `'automatic'`: The system default sizing.
 * - `'fitted'`: Sizes the sheet to fit its content.
 * - `'form'`: A compact, centered form sheet.
 * - `'page'`: A larger page sheet.
 *
 * @remarks Sizing mainly affects the regular size class (iPad); in a compact size class (iPhone)
 * sheets remain edge-attached and detents drive the height.
 */
export type PresentationSizingType = 'automatic' | 'fitted' | 'form' | 'page';

/**
 * Sets the sizing of a sheet presentation.
 * @param sizing - The sizing behavior to apply.
 * @platform ios 18.0+
 * @platform tvos 18.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationsizing(_:)).
 */
export const presentationSizing = (sizing: PresentationSizingType) =>
  createModifier('presentationSizing', { sizing });
