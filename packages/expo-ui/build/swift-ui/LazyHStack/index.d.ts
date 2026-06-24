import { type CommonViewModifierProps } from '../types';
export interface LazyHStackProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * The spacing between children.
     */
    spacing?: number;
    /**
     * The vertical alignment of children within the stack.
     */
    alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline' | 'lastTextBaseline';
}
export declare function LazyHStack(props: LazyHStackProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map