import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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

  description: string;

  /**
   * Additional styling.
   */

  style?: StyleProp<ViewStyle>;
};

const ContentUnavailableNativeView: React.ComponentType<ContentUnavailableProps> | null = 
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'ContentUnavailableView') : null;

/**
 * Displays a native Swift UI ContentUnavailable view.
 * @platform ios
 */

export function ContentUnavailableView(props: ContentUnavailableProps) {
  if (!ContentUnavailableNativeView) {
    return null;
  }
  return <ContentUnavailableNativeView {...props} />;
}
