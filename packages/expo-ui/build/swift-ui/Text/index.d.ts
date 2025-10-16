import type { ColorValue } from 'react-native';
import { type CommonViewModifierProps } from '../types';
export interface TextProps extends CommonViewModifierProps {
    /**
     * The children of the text.
     * Only string and number are supported.
     */
    children?: React.ReactNode;
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
    color?: ColorValue;
}
export declare function Text(props: TextProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map