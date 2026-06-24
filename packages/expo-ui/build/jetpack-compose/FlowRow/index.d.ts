import { type HorizontalArrangement, type PrimitiveBaseProps, type VerticalArrangement } from '../layout-types';
export interface FlowRowProps extends PrimitiveBaseProps {
    children?: React.ReactNode;
    /**
     * Horizontal arrangement of children.
     */
    horizontalArrangement?: HorizontalArrangement;
    /**
     * Vertical arrangement of children.
     */
    verticalArrangement?: VerticalArrangement;
}
export declare function FlowRow(props: FlowRowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map