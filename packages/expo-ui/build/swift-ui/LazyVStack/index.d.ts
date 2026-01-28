import { type CommonViewModifierProps } from '../types';
export type LazyVStackProps = {
    children: React.ReactNode;
    /**
     * The horizontal alignment of children within the stack.
     */
    alignment?: 'leading' | 'center' | 'trailing';
    /**
     * The spacing between children.
     */
    spacing?: number;
} & CommonViewModifierProps;
export declare function LazyVStack(props: LazyVStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map