import { requireNativeView } from 'expo';
import { type SFSymbol } from 'sf-symbols-typescript';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ContentUnavailableViewProps extends CommonViewModifierProps {
  /**
   * A short title that describes why the content is not available.
   */
  title?: string;

  /**
   * SF Symbol indicating why the content is not available.
   */
  systemImage?: SFSymbol;

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
  return <ContentUnavailableViewNativeView {...transformContentUnavailableViewProps(props)} />;
}
