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
  handleAction: (action: NavigationAction) => void;
  getState: () => State;
  emitter: NavigationEventEmitter<any>;
  router: Router<State, Action>;
  registryRef: React.RefObject<RouterRegistry | undefined>;
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
>({
  id: navigatorId,
  handleAction,
  getState,
  emitter,
  router,
  registryRef,
}: Options<State, Action>) {
  const parentNavigationHelpers = use(NavigationContext);

  return React.useMemo(() => {
    const dispatchSync = (action: Action) => {
      const state = getState();
      if (!registryRef.current?.has(state.key)) {
        throw new Error(
          `Cannot dispatch synchronously because navigator '${state.key}' is not registered. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
        );
      }

      handleAction(action);
    };

    const dispatch = (action: Action) => {
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
        return getState();
      },
    } as NavigationHelpers<ParamListBase, EventMap> & ActionHelpers;

    return navigationHelpers;
  }, [
    router,
    parentNavigationHelpers,
    emitter.emit,
    getState,
    handleAction,
    navigatorId,
    registryRef,
  ]);
}
