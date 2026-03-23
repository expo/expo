"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationHelpers = useNavigationHelpers;
const React = __importStar(require("react"));
const routers_1 = require("../routers");
const NavigationContext_1 = require("./NavigationContext");
const types_1 = require("./types");
// This is to make TypeScript compiler happy
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
types_1.PrivateValueStore;
/**
 * Navigation object with helper methods to be used by a navigator.
 * This object includes methods for common actions as well as methods the parent screen's navigation object.
 */
function useNavigationHelpers({ id: navigatorId, onAction, onUnhandledAction, getState, emitter, router, stateRef, }) {
    const parentNavigationHelpers = React.useContext(NavigationContext_1.NavigationContext);
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
            ...routers_1.CommonActions,
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
                return (router.getStateForAction(state, routers_1.CommonActions.goBack(), {
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