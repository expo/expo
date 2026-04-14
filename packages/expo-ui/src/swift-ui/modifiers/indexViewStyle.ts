import { createModifier } from './createModifier';

export type PageIndexBackgroundDisplayMode = 'automatic' | 'always' | 'never' | 'interactive';

/**
 * Configuration for the `indexViewStyle` modifier.
 */
export type IndexViewStyleConfig = {
  /**
   * Translucent background behind the page indicator dots. Useful when the
   * dots sit on top of dark or busy content.
   * @default 'automatic'
   */
  backgroundDisplayMode?: PageIndexBackgroundDisplayMode;
};

/**
 * Sets the style for the page index view inside a `TabView`. SwiftUI only
 * ships a `.page` index view style, so no style selector is exposed.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/indexviewstyle(_:)).
 */
export const indexViewStyle = (config: IndexViewStyleConfig = {}) =>
  createModifier('indexViewStyle', { type: 'page', ...config });
