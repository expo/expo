import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { requireNativeView } from 'expo';

export type ContentUnavailableProps = {
  /**
   * A short title that describes why the content is not available.
   */
  title?: string;

  /**
   * SF Symbol indicating why the content is not available.
   */

  systemImage?: string;

  /**
   * Description of why the content is not available.
   */

  description: React.ReactNode;

  /**
   * Additional styling.
   */

  style?: StyleProp<ViewStyle>;
};

const ContentUnavailableNativeView: React.ComponentType<ContentUnavailableProps> =
  requireNativeView('ExpoUI', 'ExpoContentUnavailableView');

/**
 * Displays a native Swift UI ContentUnavailable view.
 * @platform ios
 */

export function ContentUnavailableView(props: ContentUnavailableProps) {
  return <ContentUnavailableNativeView {...props} />;
}
