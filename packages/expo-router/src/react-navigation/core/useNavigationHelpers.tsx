'use client';
import * as React from 'react';
import { use } from 'react';

import type { RouterRegistry } from '../../global-state/routerRegistry';
import { routingQueue } from '../../global-state/routingQueue';
import {
  CommonActions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../routers';
import { NavigationContext } from './NavigationContext';
import { type NavigationHelpers, PrivateValueStore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';

// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;

type Options<State extends NavigationState, Action extends NavigationAction> = {
  id: string | undefined;
  onAction: (action: NavigationAction) => boolean;
  onUnhandledAction: (action: NavigationAction) => void;
  getState: () => State;
  emitter: NavigationEventEmitter<any>;
  router: Router<State, Action>;
  stateRef: React.RefObject<State | null>;
  registryRef: React.RefObject<RouterRegistry | undefined>;
};

export const FUNCTIONAL_DISPATCH_ERROR =
  '`navigation.dispatch` only accepts plain actions because actions are queued until after React commits. Functional actions depend on synchronous state. Use `navigation.dispatchSync((state) => action)` instead.';

/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods from the parent screen's navigation object.
 */
export function useNavigationHelpers<
  State extends NavigationState,
  ActionHelpers extends Record<string, () => void>,
  Action extends NavigationAction,
  EventMap extends Record<string, any>,
>({
  id: navigatorId,
  onAction,
  onUnhandledAction,
  getState,
  emitter,
  router,
  stateRef,
  registryRef,
}: Options<State, Action>) {
  const parentNavigationHelpers = use(NavigationContext);

  return React.useMemo(() => {
    const dispatchSync = (op: Action | ((state: State) => Action)) => {
      const state = getState();
      if (!registryRef.current?.has(state.key)) {
        throw new Error(
          `Cannot dispatch synchronously because navigator '${state.key}' is not registered. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
        );
      }

      const action = typeof op === 'function' ? op(state) : op;

      const handled = onAction(action);

      if (!handled) {
        onUnhandledAction?.(action);
      }
    };

    const dispatch = (action: Action) => {
      if (typeof action === 'function') {
        throw new Error(FUNCTIONAL_DISPATCH_ERROR);
      }

      routingQueue.add({
        type: 'NAVIGATOR_ACTION',
        payload: {
          action,
          // The queued action was already constrained to this navigator's action type.
          dispatchSync: (queuedAction) => dispatchSync(queuedAction as Action),
        },
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
      canGoBack: () => {
        const state = getState();

        return (
          router.getStateForAction(state, CommonActions.goBack() as Action, {
            routeNames: state.routeNames,
            routeGetIdList: {},
          }) !== null ||
          parentNavigationHelpers?.canGoBack() ||
          false
        );
      },
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
      getState: (): State => {
        // FIXME: Workaround for when the state is read during render
        // By this time, we haven't committed the new state yet
        // Without this `useSyncExternalStore` will keep reading the old state
        // This may result in `useNavigationState` or `useIsFocused` returning wrong values
        // Apart from `useSyncExternalStore`, `getState` should never be called during render
        if (stateRef.current != null) {
          return stateRef.current;
        }

        return getState();
      },
    } as NavigationHelpers<ParamListBase, EventMap> & ActionHelpers;

    return navigationHelpers;
  }, [
    router,
    parentNavigationHelpers,
    emitter.emit,
    getState,
    onAction,
    onUnhandledAction,
    navigatorId,
    stateRef,
    registryRef,
  ]);
}
