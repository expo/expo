import { createModifier } from './createModifier';

export type PageIndexDisplayMode = 'automatic' | 'always' | 'never';

/**
 * Configuration for the `tabViewStyle` modifier.
 *
 *  - `'page'` — swipeable horizontal pager with optional dot indicators.
 *  - `'automatic'` — SwiftUI's default tab-bar style. Children must apply the
 *    `tabItem({...})` modifier (icon and/or label), otherwise the tab bar
 *    renders blank slots.
 */
export type TabViewStyleConfig =
  | {
      type: 'page';
      /**
       * Visibility of the page indicator dots. Only meaningful for the page style.
       * @default 'automatic'
       */
      indexDisplayMode?: PageIndexDisplayMode;
    }
  | {
      type: 'automatic';
    };

/**
 * Sets the style for a `TabView`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/tabviewstyle(_:)).
 */
export const tabViewStyle = (config: TabViewStyleConfig) => createModifier('tabViewStyle', config);
