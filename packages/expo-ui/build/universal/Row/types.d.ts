import type { UniversalAlignment, UniversalBaseProps } from '../types';
/**
 * Props for the [`Row`](#row) component, a horizontal layout container.
 */
export interface RowProps extends UniversalBaseProps {
    /**
     * Content to render inside the row.
     */
    children?: React.ReactNode;
    /**
     * Cross-axis (vertical) alignment of children.
     * @default 'start'
     */
    alignment?: UniversalAlignment;
    /**
     * Horizontal spacing between children, in density-independent pixels.
     */
    spacing?: number;
}
//# sourceMappingURL=types.d.ts.map