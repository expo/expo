import { type HorizontalAlignment, type HorizontalArrangement, type PrimitiveBaseProps, type VerticalAlignment, type VerticalArrangement } from '../layout-types';
export interface RowProps extends PrimitiveBaseProps {
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
}
export declare function Row(props: RowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map