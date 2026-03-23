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
exports.useDescriptors = useDescriptors;
const React = __importStar(require("react"));
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
const NavigationProvider_1 = require("./NavigationProvider");
const SceneView_1 = require("./SceneView");
const ThemeContext_1 = require("./theming/ThemeContext");
const useNavigationCache_1 = require("./useNavigationCache");
const useRouteCache_1 = require("./useRouteCache");
/**
 * Hook to create descriptor objects for the child routes.
 *
 * A descriptor object provides 3 things:
 * - Helper method to render a screen
 * - Options specified by the screen for the navigator
 * - Navigation object intended for the route
 */
function useDescriptors({ state, screens, navigation, screenOptions, screenLayout, onAction, getState, setState, addListener, addKeyedListener, onRouteFocus, router, emitter, }) {
    const theme = React.useContext(ThemeContext_1.ThemeContext);
    const [options, setOptions] = React.useState({});
    const { onDispatchAction, onOptionsChange, scheduleUpdate, flushUpdates, stackRef } = React.useContext(NavigationBuilderContext_1.NavigationBuilderContext);
    const context = React.useMemo(() => ({
        navigation,
        onAction,
        addListener,
        addKeyedListener,
        onRouteFocus,
        onDispatchAction,
        onOptionsChange,
        scheduleUpdate,
        flushUpdates,
        stackRef,
    }), [
        navigation,
        onAction,
        addListener,
        addKeyedListener,
        onRouteFocus,
        onDispatchAction,
        onOptionsChange,
        scheduleUpdate,
        flushUpdates,
        stackRef,
    ]);
    const { base, navigations } = (0, useNavigationCache_1.useNavigationCache)({
        state,
        getState,
        navigation,
        setOptions,
        router,
        emitter,
    });
    const routes = (0, useRouteCache_1.useRouteCache)(state.routes);
    const getOptions = (route, navigation, overrides) => {
        const config = screens[route.name];
        const screen = config.props;
        const optionsList = [
            // The default `screenOptions` passed to the navigator
            screenOptions,
            // The `screenOptions` props passed to `Group` elements
            ...(config.options
                ? config.options.filter(Boolean)
                : []),
            // The `options` prop passed to `Screen` elements,
            screen.options,
            // The options set via `navigation.setOptions`
            overrides,
        ];
        return optionsList.reduce((acc, curr) => Object.assign(acc, 
        // @ts-expect-error: we check for function but TS still complains
        typeof curr !== 'function' ? curr : curr({ route, navigation, theme })), {});
    };
    const render = (route, navigation, customOptions, routeState) => {
        const config = screens[route.name];
        const screen = config.props;
        const clearOptions = () => setOptions((o) => {
            if (route.key in o) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [route.key]: _, ...rest } = o;
                return rest;
            }
            return o;
        });
        const layout = 
        // The `layout` prop passed to `Screen` elements,
        screen.layout ??
            // The `screenLayout` props passed to `Group` elements
            config.layout ??
            // The default `screenLayout` passed to the navigator
            screenLayout;
        let element = (<SceneView_1.SceneView navigation={navigation} route={route} screen={screen} routeState={routeState} getState={getState} setState={setState} options={customOptions} clearOptions={clearOptions}/>);
        if (layout != null) {
            element = layout({
                route,
                navigation,
                options: customOptions,
                // @ts-expect-error: in practice `theme` will be defined
                theme,
                children: element,
            });
        }
        return (<NavigationBuilderContext_1.NavigationBuilderContext.Provider key={route.key} value={context}>
        <NavigationProvider_1.NavigationProvider route={route} navigation={navigation}>
          {element}
        </NavigationProvider_1.NavigationProvider>
      </NavigationBuilderContext_1.NavigationBuilderContext.Provider>);
    };
    const descriptors = routes.reduce((acc, route, i) => {
        const navigation = navigations[route.key];
        const customOptions = getOptions(route, navigation, options[route.key]);
        const element = render(route, navigation, customOptions, state.routes[i].state);
        acc[route.key] = {
            route,
            // @ts-expect-error: it's missing action helpers, fix later
            navigation,
            render() {
                return element;
            },
            options: customOptions,
        };
        return acc;
    }, {});
    /**
     * Create a descriptor object for a route.
     *
     * @param route Route object for which the descriptor should be created
     * @param placeholder Whether the descriptor should be a placeholder, e.g. for a route not yet in the state
     * @returns Descriptor object
     */
    const describe = (route, placeholder) => {
        if (!placeholder) {
            if (!(route.key in descriptors)) {
                throw new Error(`Couldn't find a route with the key ${route.key}.`);
            }
            return descriptors[route.key];
        }
        const navigation = base;
        const customOptions = getOptions(route, navigation, {});
        const element = render(route, navigation, customOptions, undefined);
        return {
            route,
            navigation,
            render() {
                return element;
            },
            options: customOptions,
        };
    };
    return {
        describe,
        descriptors,
    };
}
//# sourceMappingURL=useDescriptors.js.map