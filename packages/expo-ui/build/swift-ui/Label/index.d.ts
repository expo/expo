import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export type LabelProps = {
    /**
     * The title text to be displayed in the label.
     */
    title?: string;
    /**
     * The name of the SFSymbol to be displayed in the label.
     */
    systemImage?: SFSymbol;
    /**
     * The color of the label icon.
     */
    color?: string;
} & CommonViewModifierProps;
/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export declare function Label(props: LabelProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map