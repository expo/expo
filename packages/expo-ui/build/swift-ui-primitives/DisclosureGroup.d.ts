import { type CommonViewModifierProps } from './types';
import { type ViewEvent } from '../types';
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
type StateChangeEvent = ViewEvent<'onStateChange', {
    isExpanded: boolean;
}>;
export type NativeDisclosureGroupProps = Omit<DisclosureGroupProps, 'onStateChange'> & StateChangeEvent;
export declare function DisclosureGroup(props: DisclosureGroupProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=DisclosureGroup.d.ts.map