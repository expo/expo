import { type CommonViewModifierProps } from '../types';
export interface DisclosureGroupProps extends CommonViewModifierProps {
    /**
     * Text label for the disclosure group. Use `DisclosureGroup.Label` for custom label content.
     */
    label?: string;
    children: React.ReactNode;
    /**
     * Controls whether the disclosure group is expanded.
     */
    isExpanded?: boolean;
    /**
     * A callback that is called when the expansion state changes.
     */
    onIsExpandedChange?: (isExpanded: boolean) => void;
}
declare function DisclosureGroupComponent(props: DisclosureGroupProps): import("react/jsx-runtime").JSX.Element;
declare namespace DisclosureGroupComponent {
    var Label: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
export { DisclosureGroupComponent as DisclosureGroup };
//# sourceMappingURL=index.d.ts.map