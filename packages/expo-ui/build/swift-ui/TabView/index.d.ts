import { Tab } from './Tab';
import { type CommonViewModifierProps } from '../types';
export type TabViewProps = {
    /**
     * The selected tab (controlled mode). Pair with `onSelectionChange`.
     * Pass `defaultSelection` instead to let the native view manage state.
     */
    selection?: string;
    /**
     * The initially selected tab when the component is uncontrolled
     * (no `selection` prop). Ignored if `selection` is provided.
     */
    defaultSelection?: string;
    /**
     * Called when the selected tab changes.
     */
    onSelectionChange?: (selection: string) => void;
    /**
     * `<TabView.Tab>` elements defining the pages.
     */
    children: React.ReactElement | React.ReactElement[];
} & CommonViewModifierProps;
declare function TabView(props: TabViewProps): import("react/jsx-runtime").JSX.Element;
export type { TabProps } from './Tab';
/**
 * A SwiftUI `TabView`. Pair with modifiers to choose the appearance:
 *
 * - `tabViewStyle({ type: 'page' })` — swipeable pager.
 * - `tabViewStyle({ type: 'automatic' })` — bottom tab bar.
 * - `tabViewStyle({ type: 'sidebarAdaptable' })` — sidebar on iPad, tab bar on iPhone.
 *
 * Use `<TabView.Tab>` children to define pages. Each tab is identified by its
 * `value` prop, which is used for selection.
 *
 * For routed bottom-tab navigation across full-screen routes, prefer
 * `expo-router/unstable-native-tabs`.
 *
 * @platform ios
 */
declare const _TabView: typeof TabView & {
    Tab: typeof Tab;
};
export { _TabView as TabView };
//# sourceMappingURL=index.d.ts.map