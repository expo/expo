import type { UniversalBaseProps } from '../types';
/**
 * Props for the [`ScrollView`](#scrollview) component.
 */
export interface ScrollViewProps extends UniversalBaseProps {
    /**
     * Content to render inside the scroll view.
     */
    children?: React.ReactNode;
    /**
     * Scroll direction.
     * @default 'vertical'
     */
    direction?: 'vertical' | 'horizontal';
    /**
     * Whether to show scroll indicators.
     * @default true
     * @platform ios
     * @platform web
     */
    showsIndicators?: boolean;
}
//# sourceMappingURL=types.d.ts.map