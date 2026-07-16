'use client';
import * as React from 'react';
import { use } from 'react';

import {
  CommonActions,
  StackActions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../routers';
import type { DispatchRoot } from './NavigationBuilderContext';
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
  dispatchRoot?: DispatchRoot;
};

/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods the parent screen's navigation object.
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
  dispatchRoot,
}: Options<State, Action>) {
  const parentNavigationHelpers = use(NavigationContext);

  return React.useMemo(() => {
    const dispatch = (op: Action | ((state: State) => Action)) => {
      const state = getState();
      const action = typeof op === 'function' ? op(state) : op;

      if (dispatchRoot) {
        // The committed store is the single dispatch path — forward to the root reducer, tagged
        // with this navigator's key. No local reducer fallback: `dispatchRoot` reports unhandled
        // actions itself, and it holds+replays actions dispatched before the origin navigator's
        // reducer has registered (the mount window).
        dispatchRoot(action, { originKey: state.key });
        return;
      }

      const handled = onAction(action);

      if (!handled) {
        onUnhandledAction?.(action);
      }
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
      emit: emitter.emit,
      isFocused: parentNavigationHelpers ? parentNavigationHelpers.isFocused : () => true,
      canGoBack: () => {
        const state = getState();

        return (
          router.getStateForAction(state, CommonActions.goBack() as Action, {
            routeNames: state.routeNames,
            // goBack never creates routes, so the key-deriving parentRouteKey is irrelevant here.
            parentRouteKey: undefined,
            routeParamList: {},
            routeGetIdList: {},
          }) !== null ||
          parentNavigationHelpers?.canGoBack() ||
          false
        );
      },
      canDismiss: () => {
        const state = getState();

        // Mirror of `canGoBack`, but simulating the `POP` that `dismiss()` dispatches. Only a
        // StackRouter handles POP; tab/drawer routers fall through to `null`, so we walk up to a
        // poppable ancestor stack (if any). Like `canGoBack`, this does not account for
        // `usePreventRemove`/`beforeRemove` guards that can block the actual pop.
        return (
          router.getStateForAction(state, StackActions.pop(1) as Action, {
            routeNames: state.routeNames,
            parentRouteKey: undefined,
            routeParamList: {},
            routeGetIdList: {},
          }) !== null ||
          parentNavigationHelpers?.canDismiss?.() ||
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
    onAction,
    onUnhandledAction,
    navigatorId,
    dispatchRoot,
  ]);
}
