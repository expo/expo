import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type ScrollViewProps = {
  children: React.ReactNode;
  /**
   * The scrollable axes.
   * @default 'vertical'
   */
  axes?: 'vertical' | 'horizontal' | 'both';
  /**
   * Whether to show scroll indicators.
   * @default true
   */
  showsIndicators?: boolean;
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
