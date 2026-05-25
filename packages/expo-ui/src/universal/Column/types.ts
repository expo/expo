import type { UniversalAlignment, UniversalBaseProps } from '../types';

/**
 * Props for the [`Column`](#column) component, a vertical layout container.
 */
export interface ColumnProps extends UniversalBaseProps {
  /**
   * Content to render inside the column.
   */
  children?: React.ReactNode;

  /**
   * Cross-axis (horizontal) alignment of children.
   * @default 'start'
   */
  alignment?: UniversalAlignment;

  /**
   * Vertical spacing between children, in density-independent pixels.
   */
  spacing?: number;
}
