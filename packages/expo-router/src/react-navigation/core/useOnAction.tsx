import type {
  NavigationAction,
  NavigationState,
  PartialState,
  Router,
  RouterConfigOptions,
} from '@react-navigation/routers';
import * as React from 'react';

import { DeprecatedNavigationInChildContext } from './DeprecatedNavigationInChildContext';
import {
  type ChildActionListener,
  type ChildBeforeRemoveListener,
  NavigationBuilderContext,
} from './NavigationBuilderContext';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
import { shouldPreventRemove, useOnPreventRemove } from './useOnPreventRemove';

type Options<State extends NavigationState> = {
  router: Router<State, NavigationAction>;
  key?: string;
  getState: () => State;
  setState: (state: State | PartialState<State>) => void;
  actionListeners: ChildActionListener[];
  beforeRemoveListeners: Record<string, ChildBeforeRemoveListener | undefined>;
  routerConfigOptions: RouterConfigOptions;
  emitter: NavigationEventEmitter<EventMapCore<any>>;
};

/**
 * Hook to handle actions for a navigator, including state updates and bubbling.
 *
 * Bubbling an action is achieved in 2 ways:
 * 1. To bubble action to parent, we expose the action handler in context and then access the parent context
 * 2. To bubble action to child, child adds event listeners subscribing to actions from parent
 *
 * When the action handler handles as action, it returns `true`, otherwise `false`.
 */
export function useOnAction<State extends NavigationState>({
  router,
  getState,
  setState,
  key,
  actionListeners,
  beforeRemoveListeners,
  routerConfigOptions,
  emitter,
}: Options<State>) {
  const {
    onAction: onActionParent,
    onRouteFocus: onRouteFocusParent,
    addListener: addListenerParent,
    onDispatchAction,
  } = React.useContext(NavigationBuilderContext);
  const navigationInChildEnabled = React.useContext(
    DeprecatedNavigationInChildContext
  );

  const routerConfigOptionsRef =
    React.useRef<RouterConfigOptions>(routerConfigOptions);

  React.useEffect(() => {
    routerConfigOptionsRef.current = routerConfigOptions;
  });

  const onAction = React.useCallback(
    (
      action: NavigationAction,
      visitedNavigators: Set<string> = new Set<string>()
    ) => {
      const state = getState();

      // Since actions can bubble both up and down, they could come to the same navigator again
      // We keep track of navigators which have already tried to handle the action and return if it's already visited
      if (visitedNavigators.has(state.key)) {
        return false;
      }

      visitedNavigators.add(state.key);

      if (typeof action.target !== 'string' || action.target === state.key) {
        let result = router.getStateForAction(
          state,
          action,
          routerConfigOptionsRef.current
        );

        // If a target is specified and set to current navigator, the action shouldn't bubble
        // So instead of `null`, we use the state object for such cases to signal that action was handled
        result =
          result === null && action.target === state.key ? state : result;

        if (result !== null) {
          onDispatchAction(action, state === result);

          if (state !== result) {
            const isPrevented = shouldPreventRemove(
              emitter,
              beforeRemoveListeners,
              state.routes,
              result.routes,
              action
            );

            if (isPrevented) {
              return true;
            }

            setState(result);
          }

          if (onRouteFocusParent !== undefined) {
            // Some actions such as `NAVIGATE` also want to bring the navigated route to focus in the whole tree
            // This means we need to focus all of the parent navigators of this navigator as well
            const shouldFocus = router.shouldActionChangeFocus(action);

            if (shouldFocus && key !== undefined) {
              onRouteFocusParent(key);
            }
          }

          return true;
        }
      }

      if (onActionParent !== undefined) {
        // Bubble action to the parent if the current navigator didn't handle it
        if (onActionParent(action, visitedNavigators)) {
          return true;
        }
      }

      if (
        typeof action.target === 'string' ||
        // For backward compatibility
        action.type === 'NAVIGATE_DEPRECATED' ||
        navigationInChildEnabled
      ) {
        // If the action wasn't handled by current navigator or a parent navigator, let children handle it
        // Handling this when target isn't specified is deprecated and will be removed in the future
        for (let i = actionListeners.length - 1; i >= 0; i--) {
          const listener = actionListeners[i];

          if (listener(action, visitedNavigators)) {
            return true;
          }
        }
      }

      return false;
    },
    [
      actionListeners,
      beforeRemoveListeners,
      emitter,
      getState,
      navigationInChildEnabled,
      key,
      onActionParent,
      onDispatchAction,
      onRouteFocusParent,
      router,
      setState,
    ]
  );

  useOnPreventRemove({
    getState,
    emitter,
    beforeRemoveListeners,
  });

  React.useEffect(
    () => addListenerParent?.('action', onAction),
    [addListenerParent, onAction]
  );

  return onAction;
}
