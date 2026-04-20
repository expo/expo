export interface StackToolbarSpacerProps {
  /**
   * Whether the spacer should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  // TODO(@ubax): implement fluid spacing in react-native-screens
  /**
   * The width of the spacing element.
   *
   * In Left/Right placements, width is required.
   * In Bottom placement, if width is not provided, the spacer will be flexible
   * and expand to fill available space.
   */
  width?: number;
  // TODO(@ubax): implement missing props in react-native-screens
  /**
   * Whether this spacer shares background with adjacent items.
   *
   * Only available in bottom placement.
   *
   * @platform iOS 26+
   */
  sharesBackground?: boolean;
}

export interface NativeToolbarSpacerProps {
  hidden?: boolean;
  hidesSharedBackground?: boolean;
  sharesBackground?: boolean;
  width?: number;
}
