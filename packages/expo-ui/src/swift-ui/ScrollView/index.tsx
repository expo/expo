import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type ScrollViewProps = {
  children: React.ReactNode;
  /**
   * The scrollable axes. Pass `'both'` to enable 2D (horizontal + vertical) scrolling.
   * @default 'vertical'
   */
  axes?: 'vertical' | 'horizontal' | 'both';
  /**
   * Visibility of the scroll indicators. Mirrors SwiftUI's `scrollIndicators(_:)` modifier.
   * - `'automatic'`: platform-default behavior.
   * - `'visible'`: prefer showing indicators (may still be hidden by the system).
   * - `'hidden'`: prefer hiding indicators (may still be shown by the system).
   * - `'never'`: never show indicators.
   * @default 'automatic'
   */
  scrollIndicators?: 'automatic' | 'visible' | 'hidden' | 'never';
} & CommonViewModifierProps;

const ScrollViewNativeView: React.ComponentType<ScrollViewProps> = requireNativeView(
  'ExpoUI',
  'ScrollViewComponent'
);

export function ScrollView(props: ScrollViewProps) {
  const { modifiers, ...restProps } = props;
  return (
    <ScrollViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
