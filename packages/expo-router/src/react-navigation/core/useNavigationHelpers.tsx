'use client';
import * as React from 'react';
import { use } from 'react';

import { useEnqueueRoutingIntent } from '../../global-state/routingQueueContext';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  CommonActions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../routers';
import { isActionHandled } from '../routers/utils';
import { NavigationContext } from './NavigationContext';
import { withWarnOnceIfCalledDuringRender } from './isRenderingComponent';
import { type NavigationHelpers, PrivateValueStore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';

// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;

type Options<State extends NavigationState, Action extends NavigationAction> = {
  id: string | undefined;
  handleAction: (action: NavigationAction) => void;
  state: State;
  emitter: NavigationEventEmitter<any>;
  router: Router<State, Action>;
};

/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods from the parent screen's navigation object.
 */
export function useNavigationHelpers<
  State extends NavigationState,
  ActionHelpers extends Record<string, () => void>,
  Action extends NavigationAction,
  EventMap extends Record<string, any>,
>({ id: navigatorId, handleAction, state, emitter, router }: Options<State, Action>) {
  const parentNavigationHelpers = use(NavigationContext);
  const enqueue = useEnqueueRoutingIntent();
  // Unlike handler-only Effect Events, the public accessor can be called during render.
  const getState = useLatestCallback(() => state);

  return React.useMemo(() => {
    const dispatchSync = (action: Action) => {
      handleAction(action);
    };

    const dispatch = (action: Action) => {
      enqueue({
        type: 'ACTION',
        payload: { action, originKey: getState().key },
      });
    };

    const actions = {
      ...router.actionCreators,
      ...CommonActions,
    };

    const helpers = Object.keys(actions).reduce((acc, name) => {
      // @ts-expect-error: name is a valid key, but TypeScript is dumb
      acc[name] = (...args: any) => dispatch(actions[name](...args));
      return acc;
    }, {} as ActionHelpers);

    const navigationHelpers = {
      ...parentNavigationHelpers,
      ...helpers,
      dispatch,
      dispatchSync,
      emit: emitter.emit,
      isFocused: parentNavigationHelpers ? parentNavigationHelpers.isFocused : () => true,
      canGoBack: withWarnOnceIfCalledDuringRender(() => {
        const state = getState();
        const result = router.getStateForAction(state, CommonActions.goBack() as Action, {
          routeNames: state.routeNames,
          routeGetIdList: {},
        });

        return isActionHandled(result) || parentNavigationHelpers?.canGoBack() || false;
      }, 'navigation.canGoBack() was called during render, which can return a stale value. Use the useCanGoBack() hook to read it for the focused screen during render, or call navigation.canGoBack() in an effect or event handler.'),
      getId: () => navigatorId,
      getParent: (id?: string) => {
        if (id !== undefined) {
          let current = navigationHelpers;

          while (current && id !== current.getId()) {
            current = current.getParent();
          }

          return current;
        }

        return parentNavigationHelpers;
      },
      getState: withWarnOnceIfCalledDuringRender(
        getState,
        'navigation.getState() was called during render, which can return a stale value. Use the useNavigationState() hook to read it during render, or call navigation.getState() in an effect or event handler.'
      ),
    } as NavigationHelpers<ParamListBase, EventMap> & ActionHelpers;

    return navigationHelpers;
  }, [enqueue, router, parentNavigationHelpers, emitter.emit, handleAction, navigatorId]);
}
