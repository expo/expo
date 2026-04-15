import { type CommonViewModifierProps } from '../types';
/**
 * Identifies a tab. Numbers index into legacy plain children; numbers or
 * strings match `Tab(value)` children when using the iOS 18+ value-based path.
 */
export type TabSelection = number | string;
export type TabViewProps = {
    /**
     * The currently selected tab (controlled mode). When supplied, JavaScript
     * owns the selection state — pair with `onSelectionChange`. Pass
     * `initialSelection` to instead let the native view manage its own state.
     *
     * - With plain children, this is the **index** of the selected page.
     * - With `<Tab>` children (iOS 18+), this is the `value` of the selected tab.
     */
    selection?: TabSelection;
    /**
     * The tab to start on when the component is uncontrolled (no `selection`
     * prop). Ignored if `selection` is provided.
     * @default 0
     */
    initialSelection?: TabSelection;
    /**
     * Called when the selected tab changes — both from user gestures and (in
     * controlled mode) when the controlled prop is updated externally.
     */
    onSelectionChange?: (selection: TabSelection) => void;
    /**
     * The tabs to display. Each child becomes a separate page. Fragments are
     * not supported — wrap content in an `@expo/ui/swift-ui` view, or use the
     * `<Tab>` component for value-based selection on iOS 18+.
     */
    children: React.ReactElement | React.ReactElement[];
} & CommonViewModifierProps;
/**
 * A SwiftUI `TabView`. Each child becomes a separate page/tab.
 *
 * No style is applied by default — pair with a `tabViewStyle({...})` modifier
 * from `@expo/ui/swift-ui/modifiers` to choose the appearance:
 *
 *  - **Page (swipeable pager)** — pass `tabViewStyle({ type: 'page' })` and,
 *    optionally, `indexViewStyle()` to configure the page indicator dots:
 *    ```tsx
 *    <TabView modifiers={[tabViewStyle({ type: 'page' })]}>
 *      <Page1 />
 *      <Page2 />
 *    </TabView>
 *    ```
 *  - **Bottom tab bar (legacy, index-based selection)** — pass
 *    `tabViewStyle({ type: 'automatic' })` and apply a `tabItem({...})`
 *    modifier on each child so the tab bar has labels and icons:
 *    ```tsx
 *    <TabView modifiers={[tabViewStyle({ type: 'automatic' })]}>
 *      <View modifiers={[tabItem({ label: 'Home', systemImage: 'house' })]}>
 *        <Home />
 *      </View>
 *    </TabView>
 *    ```
 *  - **Bottom tab bar (iOS 18+, value-based selection via `<Tab>`)** — wrap
 *    each page in a `<Tab>` to address it by `value` instead of by index. This
 *    is the only path compatible with sidebar styles like `sidebarAdaptable`:
 *    ```tsx
 *    <TabView selection={selected} onSelectionChange={setSelected}>
 *      <Tab value="home" label="Home" systemImage="house"><Home /></Tab>
 *      <Tab value="profile" label="Profile" systemImage="person"><Profile /></Tab>
 *    </TabView>
 *    ```
 *
 * For routed bottom-tab navigation across full-screen routes, prefer
 * `expo-router/unstable-native-tabs`.
 *
 * @platform ios
 */
export declare function TabView(props: TabViewProps): import("react").JSX.Element;
export { Tab, type TabProps } from './Tab';
//# sourceMappingURL=index.d.ts.map