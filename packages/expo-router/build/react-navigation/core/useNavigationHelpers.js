'use client';
import * as React from 'react';
import { use } from 'react';
import { CommonActions, } from '../routers';
import { NavigationContext } from './NavigationContext';
import { PrivateValueStore } from './types';
// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
PrivateValueStore;
/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods the parent screen's navigation object.
 */
export function useNavigationHelpers({ id: navigatorId, onAction, onUnhandledAction, getState, emitter, router, stateRef, }) {
    const parentNavigationHelpers = use(NavigationContext);
    return React.useMemo(() => {
        const dispatch = (op) => {
            const action = typeof op === 'function' ? op(getState()) : op;
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
            acc[name] = (...args) => dispatch(actions[name](...args));
            return acc;
        }, {});
        const navigationHelpers = {
            ...parentNavigationHelpers,
            ...helpers,
            dispatch,
            emit: emitter.emit,
            isFocused: parentNavigationHelpers ? parentNavigationHelpers.isFocused : () => true,
            canGoBack: () => {
                const state = getState();
                return (router.getStateForAction(state, CommonActions.goBack(), {
                    routeNames: state.routeNames,
                    routeParamList: {},
                    routeGetIdList: {},
                }) !== null ||
                    parentNavigationHelpers?.canGoBack() ||
                    false);
            },
            getId: () => navigatorId,
            getParent: (id) => {
                if (id !== undefined) {
                    let current = navigationHelpers;
                    while (current && id !== current.getId()) {
                        current = current.getParent();
                    }
                    return current;
                }
                return parentNavigationHelpers;
            },
            getState: () => {
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
        };
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
    ]);
}
//# sourceMappingURL=useNavigationHelpers.js.map