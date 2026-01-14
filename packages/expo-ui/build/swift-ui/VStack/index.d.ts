import { type CommonViewModifierProps } from '../types';
export type VStackProps = {
    /**
     * The horizontal alignment of children within the stack.
     */
    alignment?: 'leading' | 'center' | 'trailing';
    /**
     * The spacing between children.
     */
    spacing?: number;
} & CommonViewModifierProps;
export declare function VStack(props: VStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map