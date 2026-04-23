import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export type TabProps = {
    /**
     * Identifies this tab. Matched against the parent `TabView`'s `selection`
     * and `defaultSelection` props.
     */
    value: string;
    /**
     * Text label shown in the tab bar or sidebar.
     */
    label?: string;
    /**
     * SF Symbol name shown alongside the label.
     */
    systemImage?: SFSymbol;
    /**
     * The tab's content — rendered when this tab is selected.
     */
    children: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Defines a single tab inside a `TabView`.
 *
 * @example
 * ```tsx
 * <TabView selection={selected} onSelectionChange={setSelected}>
 *   <TabView.Tab value="home" label="Home" systemImage="house"><Home /></TabView.Tab>
 *   <TabView.Tab value="profile" label="Profile" systemImage="person"><Profile /></TabView.Tab>
 * </TabView>
 * ```
 *
 * @platform ios
 */
export declare function Tab(props: TabProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Tab.d.ts.map