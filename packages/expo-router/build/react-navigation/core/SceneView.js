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
exports.SceneView = SceneView;
const React = __importStar(require("react"));
const EnsureSingleNavigator_1 = require("./EnsureSingleNavigator");
const NavigationFocusedRouteStateContext_1 = require("./NavigationFocusedRouteStateContext");
const NavigationStateContext_1 = require("./NavigationStateContext");
const StaticContainer_1 = require("./StaticContainer");
const isArrayEqual_1 = require("./isArrayEqual");
const useOptionsGetters_1 = require("./useOptionsGetters");
/**
 * Component which takes care of rendering the screen for a route.
 * It provides all required contexts and applies optimizations when applicable.
 */
function SceneView({ screen, route, navigation, routeState, getState, setState, options, clearOptions, }) {
    const navigatorKeyRef = React.useRef(undefined);
    const getKey = React.useCallback(() => navigatorKeyRef.current, []);
    const { addOptionsGetter } = (0, useOptionsGetters_1.useOptionsGetters)({
        key: route.key,
        options,
        navigation,
    });
    const setKey = React.useCallback((key) => {
        navigatorKeyRef.current = key;
    }, []);
    const getCurrentState = React.useCallback(() => {
        const state = getState();
        const currentRoute = state.routes.find((r) => r.key === route.key);
        return currentRoute ? currentRoute.state : undefined;
    }, [getState, route.key]);
    const setCurrentState = React.useCallback((child) => {
        const state = getState();
        const routes = state.routes.map((r) => {
            if (r.key === route.key && r.state !== child) {
                return {
                    ...r,
                    state: child,
                };
            }
            return r;
        });
        if (!(0, isArrayEqual_1.isArrayEqual)(state.routes, routes)) {
            setState({
                ...state,
                routes,
            });
        }
    }, [getState, route.key, setState]);
    const isInitialRef = React.useRef(true);
    React.useEffect(() => {
        isInitialRef.current = false;
    });
    // Clear options set by this screen when it is unmounted
    React.useEffect(() => {
        return clearOptions;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const getIsInitial = React.useCallback(() => isInitialRef.current, []);
    const parentFocusedRouteState = React.useContext(NavigationFocusedRouteStateContext_1.NavigationFocusedRouteStateContext);
    const focusedRouteState = React.useMemo(() => {
        const state = {
            routes: [
                {
                    key: route.key,
                    name: route.name,
                    params: route.params,
                    path: route.path,
                },
            ],
        };
        // Add our state to the innermost route of the parent state
        const addState = (parent) => {
            const parentRoute = parent?.routes[0];
            if (parentRoute) {
                return {
                    routes: [
                        {
                            ...parentRoute,
                            state: addState(parentRoute.state),
                        },
                    ],
                };
            }
            return state;
        };
        return addState(parentFocusedRouteState);
    }, [parentFocusedRouteState, route.key, route.name, route.params, route.path]);
    const context = React.useMemo(() => ({
        state: routeState,
        getState: getCurrentState,
        setState: setCurrentState,
        getKey,
        setKey,
        getIsInitial,
        addOptionsGetter,
    }), [routeState, getCurrentState, setCurrentState, getKey, setKey, getIsInitial, addOptionsGetter]);
    const ScreenComponent = screen.getComponent ? screen.getComponent() : screen.component;
    return (<NavigationStateContext_1.NavigationStateContext.Provider value={context}>
      <NavigationFocusedRouteStateContext_1.NavigationFocusedRouteStateContext.Provider value={focusedRouteState}>
        <EnsureSingleNavigator_1.EnsureSingleNavigator>
          <StaticContainer_1.StaticContainer name={screen.name} render={ScreenComponent || screen.children} navigation={navigation} route={route}>
            {ScreenComponent !== undefined ? (<ScreenComponent navigation={navigation} route={route}/>) : screen.children !== undefined ? (screen.children({ navigation, route })) : null}
          </StaticContainer_1.StaticContainer>
        </EnsureSingleNavigator_1.EnsureSingleNavigator>
      </NavigationFocusedRouteStateContext_1.NavigationFocusedRouteStateContext.Provider>
    </NavigationStateContext_1.NavigationStateContext.Provider>);
}
//# sourceMappingURL=SceneView.js.map