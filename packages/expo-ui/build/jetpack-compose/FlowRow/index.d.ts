import { HorizontalArrangement, PrimitiveBaseProps, VerticalArrangement } from '../layout-types';
export type FlowRowProps = {
    children?: React.ReactNode;
    /**
     * Horizontal arrangement of children.
     */
    horizontalArrangement?: HorizontalArrangement;
    /**
     * Vertical arrangement of children.
     */
    verticalArrangement?: VerticalArrangement;
} & PrimitiveBaseProps;
export declare function FlowRow(props: FlowRowProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map