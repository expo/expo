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
 * The link has to be inside the `NavigationStack` itself. Content presented from the stack, such
 * as a `BottomSheet` or a `Popover`, is its own presentation context and does not reach the
 * stack's destinations, so give that content its own `NavigationStack`.
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
