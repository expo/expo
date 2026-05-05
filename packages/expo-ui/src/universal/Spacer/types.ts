import type { UniversalBaseProps } from '../types';

/**
 * Props for the [`Spacer`](#spacer) component.
 *
 * A Spacer produces empty space between siblings in a [`Row`](#row) or
 * [`Column`](#column). Use `size` for a fixed amount of space, or `flexible`
 * to fill the remaining space along the parent's main axis.
 */
export interface SpacerProps extends UniversalBaseProps {
  /**
   * Fixed size in density-independent pixels. Interpreted as width in a
   * horizontal container and as height in a vertical container.
   */
  size?: number;

  /**
   * When `true`, the spacer expands to fill the available space along the
   * parent's main axis, pushing sibling content to the opposite end.
   * @default false
   */
  flexible?: boolean;
}
