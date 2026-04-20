import { type CommonViewModifierProps } from '../types';
export type LazyHStackProps = {
    children: React.ReactNode;
    /**
     * The spacing between children.
     */
    spacing?: number;
    /**
     * The vertical alignment of children within the stack.
     */
    alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
} & CommonViewModifierProps;
export declare function LazyHStack(props: LazyHStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map