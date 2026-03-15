import { type CommonViewModifierProps } from '../types';
export type VStackProps = {
    children: React.ReactNode;
    /**
     * The horizontal alignment of children within the stack.
     */
    alignment?: 'leading' | 'center' | 'trailing';
    /**
     * The spacing between children.
     */
    spacing?: number;
    /**
     * Marks this stack as a scroll target layout for `scrollPosition` tracking.
     * @platform ios 17.0+
     */
    scrollTargetLayout?: boolean;
} & CommonViewModifierProps;
export declare function VStack(props: VStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map