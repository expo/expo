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
   * @deprecated Use `fixedSize()` modifier instead. This prop will be removed in a future version.
   * @example
   * ```tsx
   * // Old way (deprecated)
   * <Text fixedSize={true}>Hello</Text>
   *
   * // New way (recommended)
   * <Text modifiers={[fixedSize(true)]}>Hello</Text>
   * ```
   */
  fixedSize?: boolean;

  /**
   * @deprecated Use `frame()` modifier instead. This prop will be removed in a future version.
   * @example
   * ```tsx
   * // Old way (deprecated)
   * <Text frame={{ width: 100, height: 50 }}>Hello</Text>
   *
   * // New way (recommended)
   * <Text modifiers={[frame({ width: 100, height: 50 })]}>Hello</Text>
   * ```
   */
  frame?: FrameProps;

  /**
   * @deprecated Use `padding()` modifier instead. This prop will be removed in a future version.
   * @example
   * ```tsx
   * // Old way (deprecated)
   * <Text padding={{ all: 16 }}>Hello</Text>
   *
   * // New way (recommended)
   * <Text modifiers={[padding({ all: 16 })]}>Hello</Text>
   * ```
   */
  padding?: PaddingProps;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string;

  /**
   * Array of view modifiers to apply to this view.
   * Modifiers are applied in the order they appear in the array.
   *
   * @example
   * ```tsx
   * import { background, cornerRadius, shadow, frame, padding, fixedSize } from 'expo-ui/swift-ui/modifiers';
   *
   * <Text modifiers={[
   *   background('#FF0000'),
   *   cornerRadius(10),
   *   padding({ all: 16 }),
   *   frame({ width: 200 }),
   *   shadow({ radius: 5, x: 0, y: 2 })
   * ]}>
   *   Hello World
   * </Text>
   * ```
   */
  modifiers?: import('./modifiers').ViewModifier[];
}
