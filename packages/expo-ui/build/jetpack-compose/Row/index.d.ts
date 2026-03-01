import { HorizontalAlignment, HorizontalArrangement, PrimitiveBaseProps, VerticalAlignment, VerticalArrangement } from '../layout-types';
export type RowProps = {
    children?: React.ReactNode;
    /**
     * Horizontal arrangement of children.
     */
    horizontalArrangement?: HorizontalArrangement;
    /**
     * Vertical arrangement of children.
     */
    verticalArrangement?: VerticalArrangement;
    /**
     * Horizontal alignment of children.
     */
    horizontalAlignment?: HorizontalAlignment;
    /**
     * Vertical alignment of children.
     */
    verticalAlignment?: VerticalAlignment;
} & PrimitiveBaseProps;
export declare function Row(props: RowProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map