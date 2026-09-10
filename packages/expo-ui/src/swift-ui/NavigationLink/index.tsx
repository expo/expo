import { requireNativeView } from 'expo';
import { type ComponentType, type ReactNode } from 'react';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface NavigationLinkProps extends CommonViewModifierProps {
  /**
   * The value to append to the enclosing `NavigationStack`'s path when the link is tapped. The
   * stack presents the `NavigationDestination` whose `value` matches.
   */
  value: string;
  /**
   * A view that describes the link.
   */
  children: ReactNode;
}

const NavigationLinkNativeView: ComponentType<NavigationLinkProps> = requireNativeView(
  'ExpoUI',
  'NavigationLinkView'
);

/**
 * A view that controls a navigation presentation. In a `List` it renders as a row with a
 * disclosure chevron, and tapping it pushes the matching `NavigationDestination`.
 *
 * @example
 * ```tsx
 * <NavigationLink value="settings">
 *   <Text>Settings</Text>
 * </NavigationLink>
 * ```
 *
 * @platform ios
 */
export function NavigationLink(props: NavigationLinkProps) {
  const { modifiers, children, ...restProps } = props;
  return (
    <NavigationLinkNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </NavigationLinkNativeView>
  );
}
