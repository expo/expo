import { CommonViewModifierProps } from '../types';
export type ZStackProps = {
    children: React.ReactNode;
    /**
     * The alignment of children within the stack.
     */
    alignment?: 'center' | 'leading' | 'trailing' | 'top' | 'bottom' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing' | 'centerFirstTextBaseline' | 'centerLastTextBaseline' | 'leadingFirstTextBaseline' | 'leadingLastTextBaseline' | 'trailingFirstTextBaseline' | 'trailingLastTextBaseline';
} & CommonViewModifierProps;
export declare function ZStack(props: ZStackProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map