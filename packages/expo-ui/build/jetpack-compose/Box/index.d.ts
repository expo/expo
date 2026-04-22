import { type ContentAlignment, type FloatingToolbarExitAlwaysScrollBehavior, type PrimitiveBaseProps } from '../layout-types';
export type BoxProps = {
    children?: React.ReactNode;
    /**
     * Alignment of children within the box.
     */
    contentAlignment?: ContentAlignment;
    /**
     * Scroll behavior for the floating toolbar exit.
     */
    floatingToolbarExitAlwaysScrollBehavior?: FloatingToolbarExitAlwaysScrollBehavior;
} & PrimitiveBaseProps;
export declare function Box(props: BoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map