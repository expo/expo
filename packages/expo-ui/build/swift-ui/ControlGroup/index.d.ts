import { type ReactNode } from 'react';
import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export interface ControlGroupProps extends CommonViewModifierProps {
    /**
     * The label for the control group. Can be a string for simple text labels,
     * or a `Label` component for custom label content. When omitted, the control group
     * has no label.
     * @platform iOS
     * @platform tvOS 17.0+
     */
    label?: string | ReactNode;
    /**
     * An SF Symbol name to display alongside the label.
     * Only used when `label` is a string.
     * @platform iOS 16.0+
     * @platform tvOS 17.0+
     */
    systemImage?: SFSymbol;
    /**
     * The control group's content.
     * Can contain `Button`, `Toggle`, `Picker`, or other interactive controls.
     * @platform iOS
     * @platform tvOS 17.0+
     */
    children: ReactNode;
}
export declare function ControlGroup(props: ControlGroupProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map