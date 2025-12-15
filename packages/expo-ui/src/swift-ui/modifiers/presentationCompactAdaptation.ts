import { createModifier } from './createModifier';

export type PresentationCompactAdaptationType =
  | 'automatic'
  | 'none'
  | 'popover'
  | 'sheet'
  | 'fullScreenCover';

/**
 * Controls how presentations adapt when displayed on a compact size class device (like an iPhone).
 * By default, popovers on iPhone automatically adapt to full-screen sheets due to the compact
 * horizontal size class. This modifier allows you to override that behavior.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/presentationcompactadaptation(_:)).
 */
export const presentationCompactAdaptation = (
  adaptation:
    | PresentationCompactAdaptationType
    | { horizontal: PresentationCompactAdaptationType; vertical: PresentationCompactAdaptationType }
) => {
  if (typeof adaptation === 'string') {
    return createModifier('presentationCompactAdaptation', { adaptation });
  }
  return createModifier('presentationCompactAdaptation', adaptation);
};
