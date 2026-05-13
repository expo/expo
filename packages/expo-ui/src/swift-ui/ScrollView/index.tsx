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
   * Whether to show scroll indicators. For richer visibility control (e.g. `'never'`)
   * or per-axis control, use the `scrollIndicators(...)` modifier instead.
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
