/**
 * Presentation detent type for controlling sheet heights.
 * - `medium` - Medium height sheet
 * - `large` - Full height sheet
 * - number (0-1) - Fraction of screen height (e.g., 0.4 = 40% of screen)
 */
export type PresentationDetent = 'medium' | 'large' | number;
/**
 * Sets the available heights for a sheet presentation.
 * @param detents - Array of detents the sheet can snap to.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationdetents(_:)).
 */
export declare const presentationDetents: (detents: PresentationDetent[]) => import("./createModifier").ModifierConfig;
/**
 * Controls the visibility of the drag indicator on a sheet.
 * @param visibility - The visibility of the drag indicator.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationdragindicator(_:)).
 */
export declare const presentationDragIndicator: (visibility: "automatic" | "visible" | "hidden") => import("./createModifier").ModifierConfig;
/**
 * Presentation background interaction type.
 */
export type PresentationBackgroundInteractionType = 'automatic' | 'enabled' | 'disabled' | {
    type: 'enabledUpThrough';
    detent: PresentationDetent;
};
/**
 * Controls interaction with the content behind a sheet.
 * @param interaction - The background interaction behavior.
 * @platform ios 16.4+
 * @platform tvos 16.4+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationbackgroundinteraction(_:)).
 */
export declare const presentationBackgroundInteraction: (interaction: PresentationBackgroundInteractionType) => import("./createModifier").ModifierConfig;
/**
 * Disables interactive dismissal of a sheet.
 * @param isDisabled - Whether interactive dismiss is disabled (default: true).
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/interactivedismissdisabled(_:)).
 */
export declare const interactiveDismissDisabled: (isDisabled?: boolean) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=presentationModifiers.d.ts.map