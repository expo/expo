import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface NavigationStackProps extends CommonViewModifierProps {
  /**
   * The root view of the stack. It is displayed inside a navigation bar.
   */
  children: React.ReactNode;
}

const NavigationStackNativeView: React.ComponentType<NavigationStackProps> = requireNativeView(
  'ExpoUI',
  'NavigationStackView'
);

/**
 * A view that displays a root view and enables you to present additional views over the root view.
 *
 * @platform ios
 */
export function NavigationStack(props: NavigationStackProps) {
  const { modifiers, ...restProps } = props;
  return (
    <NavigationStackNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
