import { createModifier } from './createModifier';

export type TabItemConfig = {
  /**
   * Visible text label for the tab. Optional — pass `systemImage` alone for
   * an icon-only tab.
   */
  label?: string;
  /**
   * SF Symbol name shown above the label in the tab bar. Optional — pass
   * `label` alone for a text-only tab. At least one of `label` or
   * `systemImage` should be provided, otherwise the tab renders an empty
   * slot in the bar.
   */
  systemImage?: string;
};

/**
 * Marks a `TabView` child as a tab in the bottom tab bar (or sidebar on
 * iPad), with an optional label and SF Symbol icon. Only meaningful when
 * the parent `TabView` uses a tab-bar style (e.g.
 * `tabViewStyle({ type: 'automatic' })`); the page style doesn't render a bar.
 *
 * @example
 * ```tsx
 * <TabView modifiers={[tabViewStyle({ type: 'automatic' })]}>
 *   <VStack modifiers={[tabItem({ label: 'Home', systemImage: 'house' })]}>
 *     <Text>Home</Text>
 *   </VStack>
 * </TabView>
 * ```
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/tabitem(_:)).
 */
export const tabItem = (config: TabItemConfig = {}) => createModifier('tabItem', config);
