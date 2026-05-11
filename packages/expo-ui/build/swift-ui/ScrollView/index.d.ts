import { type CommonViewModifierProps } from '../types';
export type ScrollViewProps = {
    children: React.ReactNode;
    /**
     * The scrollable axes. Pass `'both'` to enable 2D (horizontal + vertical) scrolling.
     * @default 'vertical'
     */
    axes?: 'vertical' | 'horizontal' | 'both';
    /**
     * Visibility of the scroll indicators. Mirrors SwiftUI's `scrollIndicators(_:)` modifier.
     * - `'automatic'`: platform-default behavior.
     * - `'visible'`: prefer showing indicators (may still be hidden by the system).
     * - `'hidden'`: prefer hiding indicators (may still be shown by the system).
     * - `'never'`: never show indicators.
     * @default 'automatic'
     */
    scrollIndicators?: 'automatic' | 'visible' | 'hidden' | 'never';
} & CommonViewModifierProps;
export declare function ScrollView(props: ScrollViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map