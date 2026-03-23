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
exports.useBuildAction = void 0;
exports.useBuildHref = useBuildHref;
exports.useLinkBuilder = useLinkBuilder;
const React = __importStar(require("react"));
const core_1 = require("../core");
const LinkingContext_1 = require("./LinkingContext");
/**
 * Helper to build a href for a screen based on the linking options.
 */
function useBuildHref() {
    const navigation = React.useContext(core_1.NavigationHelpersContext);
    const route = React.useContext(core_1.NavigationRouteContext);
    const { options } = React.useContext(LinkingContext_1.LinkingContext);
    const focusedRouteState = (0, core_1.useStateForPath)();
    const getPathFromStateHelper = options?.getPathFromState ?? core_1.getPathFromState;
    const buildHref = React.useCallback((name, params) => {
        if (options?.enabled === false) {
            return undefined;
        }
        // Check that we're inside:
        // - navigator's context
        // - route context of the navigator (could be a screen, tab, etc.)
        // - route matches the state for path (from the screen's context)
        // This ensures that we're inside a screen
        const isScreen = navigation && route?.key && focusedRouteState
            ? route.key === (0, core_1.findFocusedRoute)(focusedRouteState)?.key &&
                navigation.getState().routes.some((r) => r.key === route.key)
            : false;
        const stateForRoute = {
            routes: [{ name, params }],
        };
        const constructState = (state) => {
            if (state) {
                const route = state.routes[0];
                // If we're inside a screen and at the innermost route
                // We need to replace the state with the provided one
                // This assumes that we're navigating to a sibling route
                if (isScreen && !route.state) {
                    return stateForRoute;
                }
                // Otherwise, dive into the nested state of the route
                return {
                    routes: [
                        {
                            ...route,
                            state: constructState(route.state),
                        },
                    ],
                };
            }
            // Once there is no more nested state, we're at the innermost route
            // We can add a state based on provided parameters
            // This assumes that we're navigating to a child of this route
            // In this case, the helper is used in a navigator for its routes
            return stateForRoute;
        };
        const state = constructState(focusedRouteState);
        const path = getPathFromStateHelper(state, options?.config);
        return path;
    }, [
        options?.enabled,
        options?.config,
        route?.key,
        navigation,
        focusedRouteState,
        getPathFromStateHelper,
    ]);
    return buildHref;
}
/**
 * Helper to build a navigation action from a href based on the linking options.
 */
const useBuildAction = () => {
    const { options } = React.useContext(LinkingContext_1.LinkingContext);
    const getStateFromPathHelper = options?.getStateFromPath ?? core_1.getStateFromPath;
    const getActionFromStateHelper = options?.getActionFromState ?? core_1.getActionFromState;
    const buildAction = React.useCallback((href) => {
        if (!href.startsWith('/')) {
            throw new Error(`The href must start with '/' (${href}).`);
        }
        const state = getStateFromPathHelper(href, options?.config);
        if (state) {
            const action = getActionFromStateHelper(state, options?.config);
            return action ?? core_1.CommonActions.reset(state);
        }
        else {
            throw new Error('Failed to parse the href to a navigation state.');
        }
    }, [options?.config, getStateFromPathHelper, getActionFromStateHelper]);
    return buildAction;
};
exports.useBuildAction = useBuildAction;
/**
 * Helpers to build href or action based on the linking options.
 *
 * @returns `buildHref` to build an `href` for screen and `buildAction` to build an action from an `href`.
 */
function useLinkBuilder() {
    const buildHref = useBuildHref();
    const buildAction = (0, exports.useBuildAction)();
    return {
        buildHref,
        buildAction,
    };
}
//# sourceMappingURL=useLinkBuilder.js.map