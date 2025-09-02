import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';
import { MissingHostErrorView, isMissingHost } from '../Host';

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

const ContentUnavailableViewNativeView: React.ComponentType<ContentUnavailableViewProps> =
  requireNativeView('ExpoUI', 'ContentUnavailableView');

/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 */
function transformContentUnavailableViewProps(
  props: ContentUnavailableViewProps
): ContentUnavailableViewProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

export function ContentUnavailableView(props: ContentUnavailableViewProps) {
  if (isMissingHost(props)) {
    return <MissingHostErrorView componentName="ContentUnavailableView" />;
  }
  return <ContentUnavailableViewNativeView {...transformContentUnavailableViewProps(props)} />;
}
