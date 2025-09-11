import { type CommonViewModifierProps } from '../types';
export interface TextProps extends CommonViewModifierProps {
    children: string;
    /**
     * The font weight of the text.
     * Maps to iOS system font weights.
     */
    weight?: 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
    /**
     * The font design of the text.
     * Maps to iOS system font designs.
     */
    design?: 'default' | 'rounded' | 'serif' | 'monospaced';
    /**
     * The font size of the text.
     */
    size?: number;
    /**
     * The line limit of the text.
     */
    lineLimit?: number;
    /**
     * The color of the text.
     */
    color?: string;
}
export declare function Text(props: TextProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map