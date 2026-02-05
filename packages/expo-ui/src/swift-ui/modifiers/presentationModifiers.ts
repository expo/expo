import { createModifier, createModifierWithEventListener, type ModifierConfig } from './createModifier';

/**
 * Presentation detent type for controlling sheet heights.
 * - `'medium'`: System medium height (approximately half screen)
 * - `'large'`: System large height (full screen)
 * - `{ fraction: number }`: Fraction of screen height (0-1, for example, 0.4 equals to 40% of screen)
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

  if (options?.onSelectionChange) {
    return createModifierWithEventListener(
      'presentationDetents',
      (args: { detent: PresentationDetent }) => {
        options.onSelectionChange!(args.detent);
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
 * Disables interactive dismissal of a sheet.
 * @param isDisabled - Whether interactive dismiss is disabled (default: true).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/interactivedismissdisabled(_:)).
 */
export const interactiveDismissDisabled = (isDisabled: boolean = true) =>
  createModifier('interactiveDismissDisabled', { isDisabled });
