import { type CommonViewModifierProps } from '../types';
export interface VStackProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * The horizontal alignment of children within the stack.
     */
    alignment?: 'leading' | 'center' | 'trailing';
    /**
     * The spacing between children.
     */
    spacing?: number;
}
export declare function VStack(props: VStackProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map