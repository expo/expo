import { type CommonViewModifierProps } from '../types';
export interface DisclosureGroupProps extends CommonViewModifierProps {
    label: string;
    children: React.ReactNode;
    /**
     * Controls whether the disclosure group is expanded.
     */
    isExpanded?: boolean;
    /**
     * A callback that is called when the expansion state changes.
     */
    onStateChange?: (isExpanded: boolean) => void;
}
export declare function DisclosureGroup(props: DisclosureGroupProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map