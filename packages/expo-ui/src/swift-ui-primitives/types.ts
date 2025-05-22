/**
 * Common frame properties that can be applied to any view.
 */
export interface FrameProps {
  /**
   * The width of the frame.
   */
  width?: number;
  /**
   * The height of the frame.
   */
  height?: number;

  /**
   * The minimum width of the frame.
   */
  minWidth?: number;
  /**
   * The ideal width of the frame.
   */
  idealWidth?: number;
  /**
   * The maximum width of the frame.
   */
  maxWidth?: number;
  /**
   * The minimum height of the frame.
   */
  minHeight?: number;
  /**
   * The ideal height of the frame.
   */
  idealHeight?: number;
  /**
   * The maximum height of the frame.
   */
  maxHeight?: number;

  /**
   * The alignment of the content within the frame.
   */
  alignment?:
    | 'center'
    | 'leading'
    | 'trailing'
    | 'top'
    | 'bottom'
    | 'topLeading'
    | 'topTrailing'
    | 'bottomLeading'
    | 'bottomTrailing';
}

/**
 * Common padding properties that can be applied to any view.
 */
export interface PaddingProps {
  /**
   * The padding on the top.
   */
  top?: number;
  /**
   * The padding on the leading edge (left in LTR, right in RTL).
   */
  leading?: number;
  /**
   * The padding on the bottom.
   */
  bottom?: number;
  /**
   * The padding on the trailing edge (right in LTR, left in RTL).
   */
  trailing?: number;
}

/**
 * Common props that can be applied to any view.
 */
export interface CommonViewModifierProps {
  /**
   * Whether the view should take its natural size.
   * When true, the view will ignore frame constraints and use its intrinsic size.
   */
  fixedSize?: boolean;

  /**
   * Frame properties for the view container.
   */
  frame?: FrameProps;

  /**
   * Padding properties for the view.
   */
  padding?: PaddingProps;
}
