import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type SwipeActionsEdge = 'leading' | 'trailing';

export type SwipeActionsProps = {
  /**
   * The regular content and `SwipeActions.Actions` action groups.
   */
  children: React.ReactNode;
} & CommonViewModifierProps;

export type SwipeActionsGroupProps = {
  /**
   * The edge where these swipe actions are revealed.
   * @default 'trailing'
   */
  edge?: SwipeActionsEdge;
  /**
   * Whether a full swipe automatically performs the first action in this group.
   * @default true
   */
  allowsFullSwipe?: boolean;
  /**
   * The buttons revealed when the user swipes from this edge.
   */
  children: React.ReactNode;
};

type SwipeActionsNativeProps = SwipeActionsProps;

const SwipeActionsNativeView: React.ComponentType<SwipeActionsNativeProps> = requireNativeView(
  'ExpoUI',
  'SwipeActionsView'
);

/**
 * The buttons revealed when the user swipes the regular content from an edge.
 */
export function Actions({
  edge = 'trailing',
  allowsFullSwipe = true,
  children,
}: SwipeActionsGroupProps) {
  return (
    <Slot name="actions" extraProps={{ edge, allowsFullSwipe }}>
      {children}
    </Slot>
  );
}

/**
 * Applies native SwiftUI swipe actions to its non-slot children.
 * @platform ios
 */
function SwipeActionsComponent(props: SwipeActionsProps) {
  const { modifiers, ...restProps } = props;

  return (
    <SwipeActionsNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}

const SwipeActions = Object.assign(SwipeActionsComponent, { Actions });

export { SwipeActions };
