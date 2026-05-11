import { type CommonViewModifierProps } from '../types';
export type ScrollViewProps = {
    children: React.ReactNode;
    /**
     * The scrollable axes. Pass `'both'` to enable 2D (horizontal + vertical) scrolling.
     * @default 'vertical'
     */
    axes?: 'vertical' | 'horizontal' | 'both';
    /**
     * Whether to show scroll indicators. For richer visibility control (e.g. `'never'`)
     * or per-axis control, use the `scrollIndicators(...)` modifier instead.
     * @default true
     */
    showsIndicators?: boolean;
} & CommonViewModifierProps;
export declare function ScrollView(props: ScrollViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map