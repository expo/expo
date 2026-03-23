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
exports.useOnAction = useOnAction;
const React = __importStar(require("react"));
const DeprecatedNavigationInChildContext_1 = require("./DeprecatedNavigationInChildContext");
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
const useOnPreventRemove_1 = require("./useOnPreventRemove");
/**
 * Hook to handle actions for a navigator, including state updates and bubbling.
 *
 * Bubbling an action is achieved in 2 ways:
 * 1. To bubble action to parent, we expose the action handler in context and then access the parent context
 * 2. To bubble action to child, child adds event listeners subscribing to actions from parent
 *
 * When the action handler handles as action, it returns `true`, otherwise `false`.
 */
function useOnAction({ router, getState, setState, key, actionListeners, beforeRemoveListeners, routerConfigOptions, emitter, }) {
    const { onAction: onActionParent, onRouteFocus: onRouteFocusParent, addListener: addListenerParent, onDispatchAction, } = React.useContext(NavigationBuilderContext_1.NavigationBuilderContext);
    const navigationInChildEnabled = React.useContext(DeprecatedNavigationInChildContext_1.DeprecatedNavigationInChildContext);
    const routerConfigOptionsRef = React.useRef(routerConfigOptions);
    React.useEffect(() => {
        routerConfigOptionsRef.current = routerConfigOptions;
    });
    const onAction = React.useCallback((action, visitedNavigators = new Set()) => {
        const state = getState();
        // Since actions can bubble both up and down, they could come to the same navigator again
        // We keep track of navigators which have already tried to handle the action and return if it's already visited
        if (visitedNavigators.has(state.key)) {
            return false;
        }
        visitedNavigators.add(state.key);
        if (typeof action.target !== 'string' || action.target === state.key) {
            let result = router.getStateForAction(state, action, routerConfigOptionsRef.current);
            // If a target is specified and set to current navigator, the action shouldn't bubble
            // So instead of `null`, we use the state object for such cases to signal that action was handled
            result = result === null && action.target === state.key ? state : result;
            if (result !== null) {
                onDispatchAction(action, state === result);
                if (state !== result) {
                    const isPrevented = (0, useOnPreventRemove_1.shouldPreventRemove)(emitter, beforeRemoveListeners, state.routes, result.routes, action);
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
        if (typeof action.target === 'string' ||
            // For backward compatibility
            action.type === 'NAVIGATE_DEPRECATED' ||
            navigationInChildEnabled) {
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
    }, [
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
    ]);
    (0, useOnPreventRemove_1.useOnPreventRemove)({
        getState,
        emitter,
        beforeRemoveListeners,
    });
    React.useEffect(() => addListenerParent?.('action', onAction), [addListenerParent, onAction]);
    return onAction;
}
//# sourceMappingURL=useOnAction.js.map