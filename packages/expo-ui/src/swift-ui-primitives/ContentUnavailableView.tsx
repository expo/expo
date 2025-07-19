import { requireNativeView } from 'expo';
import { Platform } from 'react-native';

import { CommonViewModifierProps } from './types';

export interface ContentUnavailableViewProps extends CommonViewModifierProps {
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
  description?: string;
}

const ContentUnavailableViewNativeView: React.ComponentType<ContentUnavailableViewProps> | null =
  Platform.OS === 'ios' ? requireNativeView('ExpoUI', 'ContentUnavailableView') : null;

/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 *
 */
export function ContentUnavailableView(props: ContentUnavailableViewProps) {
  if (!ContentUnavailableViewNativeView) {
    return null;
  }
  return <ContentUnavailableViewNativeView {...props} />;
}
