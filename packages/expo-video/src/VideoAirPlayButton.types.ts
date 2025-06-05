import { ViewProps } from 'react-native';

export interface VideoAirPlayButtonProps extends Omit<ViewProps, 'children'> {
  /**
   * The color of the button icon while AirPlay sharing is not active.
   *
   * @default undefined
   * @platform ios
   */
  tint?: string;

  /**
   * The color of the button icon while AirPlay sharing is active.
   *
   * @default undefined
   * @platform ios
   */
  activeTint?: string;

  /**
   * Determines whether the AirPlay device selection popup should show video outputs first.
   *
   * @default true
   * @platform ios
   */
  prioritizeVideoDevices?: boolean;

  /**
   * A callback called when the AirPlay route selection popup is about to show.
   * @platform ios
   */
  onBeginPresentingRoutes?: () => void;

  /**
   * A callback called when the AirPlay route selection popup has disappeared.
   * @platform ios
   */
  onEndPresentingRoutes?: () => void;
}
