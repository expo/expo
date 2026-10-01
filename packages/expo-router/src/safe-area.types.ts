/**
 * Configures safe area padding for native route content. Unspecified edges inherit from the
 * parent screen. By default, horizontal padding is enabled and vertical padding is disabled.
 * Individual edges override the axis in the same object.
 * @platform android
 * @platform ios
 */
export type SafeAreaEdges = {
  /** Enables left and right safe area padding. Defaults to `true` without inherited settings. */
  horizontal?: boolean;
  /** Enables top and bottom safe area padding. Defaults to `false` without inherited settings. */
  vertical?: boolean;
  /** Overrides horizontal padding for the left edge. */
  left?: boolean;
  /** Overrides horizontal padding for the right edge. */
  right?: boolean;
  /** Overrides vertical padding for the top edge. */
  top?: boolean;
  /** Overrides vertical padding for the bottom edge. */
  bottom?: boolean;
};
