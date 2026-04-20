import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export type TabProps = {
    /**
     * Identifies this tab. Matched against the parent `TabView`'s `selection`
     * and `defaultSelection` props.
     */
    value: number | string;
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
 *   <Tab value="home" label="Home" systemImage="house"><Home /></Tab>
 *   <Tab value="profile" label="Profile" systemImage="person"><Profile /></Tab>
 * </TabView>
 * ```
 *
 * @platform ios
 */
export declare function Tab(props: TabProps): import("react").JSX.Element;
//# sourceMappingURL=Tab.d.ts.map