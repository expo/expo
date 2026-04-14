import { requireNativeView } from 'expo';

import { type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type TabViewProps = {
  /**
   * The index of the currently selected page (controlled mode). When
   * supplied, JavaScript owns the selection state — pair with `onSelectionChange`.
   * Pass `initialSelection` to instead let the native view manage its own state.
   */
  selection?: number;
  /**
   * The page to start on when the component is uncontrolled (no `selection`
   * prop). Ignored if `selection` is provided.
   * @default 0
   */
  initialSelection?: number;
  /**
   * Called when the selected page changes — both from user swipes and (in
   * controlled mode) when the controlled prop is updated externally.
   */
  onSelectionChange?: (selection: number) => void;
  /**
   * The pages to display. Each child becomes a separate page. Fragments are
   * not supported — wrap content in an `@expo/ui/swift-ui` view.
   */
  children: React.ReactElement | React.ReactElement[];
} & CommonViewModifierProps;

type NativeTabViewProps = Omit<TabViewProps, 'onSelectionChange'> &
  ViewEvent<'onSelectionChange', { selection: number }>;

const TabViewNativeView: React.ComponentType<NativeTabViewProps> = requireNativeView(
  'ExpoUI',
  'TabView'
);

/**
 * A SwiftUI `TabView`. Each child becomes a separate page/tab.
 *
 * No style is applied by default — pair with a `tabViewStyle({...})` modifier
 * from `@expo/ui/swift-ui/modifiers` to choose the appearance:
 *
 *  - **Page (swipeable pager)** — pass `tabViewStyle({ type: 'page' })` and,
 *    optionally, `indexViewStyle({ type: 'page' })` to configure the page
 *    indicator dots:
 *    ```tsx
 *    <TabView modifiers={[tabViewStyle({ type: 'page' })]}>
 *      <Page1 />
 *      <Page2 />
 *    </TabView>
 *    ```
 *  - **Bottom tab bar** — pass `tabViewStyle({ type: 'automatic' })` and
 *    apply a `tabItem({...})` modifier on each child so the tab bar has
 *    labels and icons:
 *    ```tsx
 *    <TabView modifiers={[tabViewStyle({ type: 'automatic' })]}>
 *      <View modifiers={[tabItem({ label: 'Home', systemImage: 'house' })]}>
 *        <Home />
 *      </View>
 *    </TabView>
 *    ```
 *
 * For routed bottom-tab navigation across full-screen routes, prefer
 * `expo-router/unstable-native-tabs`.
 *
 * @platform ios
 */
export function TabView(props: TabViewProps) {
  const { modifiers, onSelectionChange, ...restProps } = props;
  return (
    <TabViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      onSelectionChange={
        onSelectionChange
          ? ({ nativeEvent: { selection } }) => onSelectionChange(selection)
          : undefined
      }
    />
  );
}
