import { type CommonViewModifierProps } from '../types';
export type HStackProps = {
    children: React.ReactNode;
    /**
     * The spacing between children.
     */
    spacing?: number;
    /**
     * The vertical alignment of children within the stack.
     */
    alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
} & CommonViewModifierProps;
export declare function HStack(props: HStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map