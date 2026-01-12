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
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
} & CommonViewModifierProps;
export declare function VStack(props: VStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map