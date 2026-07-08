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
  stateRef: React.RefObject<State | null>;
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
  stateRef,
  dispatchRoot,
}: Options<State, Action>) {
  const parentNavigationHelpers = use(NavigationContext);

  return React.useMemo(() => {
    const dispatch = (op: Action | ((state: State) => Action)) => {
      const state = getState();
      const action = typeof op === 'function' ? op(state) : op;

      if (dispatchRoot) {
        // TODO(Step 8): This root-reducer path intentionally does not reproduce the old
        // `NAVIGATE_DEPRECATED` / `navigationInChildEnabled` down-bubbling fallback from
        // `useOnAction`. If a real consumer depends on that legacy child search, reintroduce it at
        // the dispatch boundary deliberately.
        let isRootNotInitialized = false;
        let isOriginMissing = false;
        const mayFallbackLocally = action.type === 'PRELOAD' || action.target == null;
        const handled = dispatchRoot(action, {
          originKey: state.key,
          suppressUnhandled: mayFallbackLocally,
          onNotInitialized: () => {
            isRootNotInitialized = true;
          },
          onMissingOrigin: () => {
            isOriginMissing = true;
          },
        });

        if (!handled && mayFallbackLocally) {
          const shouldFallbackLocally =
            action.type === 'PRELOAD' ||
            (action.target == null &&
              (action.type === 'NAVIGATE' ||
                ((isRootNotInitialized || isOriginMissing) &&
                  (action.type === 'UPDATE' || action.type === 'NOOP'))));

          if (!shouldFallbackLocally) {
            onUnhandledAction?.(action);
            return;
          }

          const handledLocally = onAction(action);

          if (!handledLocally) {
            onUnhandledAction?.(action);
          }
        }
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
    dispatchRoot,
  ]);
}
