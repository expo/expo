import { createModifier } from './createModifier';

export type PageIndexDisplayMode = 'automatic' | 'always' | 'never';

/**
 * Configuration for the `tabViewStyle` modifier.
 *
 *  - `'page'` — swipeable horizontal pager with optional dot indicators.
 *  - `'automatic'` — SwiftUI's default tab-bar style. Children must apply the
 *    `tabItem({...})` modifier (icon and/or label), otherwise the tab bar
 *    renders blank slots.
 *  - `'sidebarAdaptable'` — iOS 18+. Sidebar on iPad/Mac, bottom bar on
 *    iPhone. Children must be `<Tab>` components for this style to work.
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
    }
  | {
      type: 'sidebarAdaptable';
    };

/**
 * Sets the style for a `TabView`.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/tabviewstyle(_:)).
 */
export const tabViewStyle = (config: TabViewStyleConfig) => createModifier('tabViewStyle', config);
