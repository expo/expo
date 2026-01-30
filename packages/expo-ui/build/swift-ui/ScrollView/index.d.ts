import { type CommonViewModifierProps } from '../types';
export type ScrollViewProps = {
    children: React.ReactNode;
    /**
     * The scrollable axes.
     * @default 'vertical'
     */
    axes?: 'vertical' | 'horizontal' | 'both';
    /**
     * Whether to show scroll indicators.
     * @default true
     */
    showsIndicators?: boolean;
} & CommonViewModifierProps;
export declare function ScrollView(props: ScrollViewProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map