export type TextProps = {
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
};
export declare function Text(props: TextProps): import("react").JSX.Element;
//# sourceMappingURL=Text.d.ts.map