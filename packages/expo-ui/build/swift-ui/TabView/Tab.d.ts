import { type CommonViewModifierProps } from '../types';
export type TabProps = {
    /**
     * The selection value associated with this tab. Matched against the parent
     * `TabView`'s `selection` prop. Required.
     */
    value: number | string;
    /**
     * Visible text label shown in the tab bar / sidebar. Optional.
     */
    label?: string;
    /**
     * SF Symbol name shown alongside the label. Optional.
     */
    systemImage?: string;
    /**
     * The tab's content (the page rendered when this tab is selected).
     */
    children: React.ReactNode;
} & CommonViewModifierProps;
/**
 * A single tab inside a `TabView`. iOS 18+ only — when the parent `TabView`
 * sees `<Tab>` children, it uses SwiftUI's value-based `Tab(value:)` API,
 * which is required for styles like `sidebarAdaptable`. On earlier iOS
 * versions, the parent falls back to the legacy index-tagged path.
 *
 * @platform ios
 */
export declare function Tab(props: TabProps): import("react").JSX.Element;
//# sourceMappingURL=Tab.d.ts.map