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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = exports.useTabs = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const core_1 = require("@react-navigation/core");
const native_1 = require("@react-navigation/native");
const Tabs_common_1 = require("./Tabs.common");
const Route_1 = require("../Route");
const useScreens_1 = require("../useScreens");
const href_1 = require("../link/href");
const url_1 = require("../utils/url");
const Tabs_router_1 = require("./Tabs.router");
const sortRoutes_1 = require("../sortRoutes");
const Tabs_bar_1 = require("./Tabs.bar");
__exportStar(require("./Tabs.slot"), exports);
__exportStar(require("./Tabs.bar"), exports);
__exportStar(require("./Tabs.common"), exports);
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = (0, core_1.createNavigatorFactory)({})();
function useTabs({ triggers, ...options }) {
    const routeNode = (0, Route_1.useRouteNode)();
    const linking = (0, react_1.useContext)(native_1.LinkingContext).options;
    if (!routeNode || !linking) {
        throw new Error('No RouteNode. This is likely a bug in expo-router.');
    }
    const { children, initialRouteName } = triggersToScreens(triggers, routeNode, linking);
    const key = `${routeNode.contextKey}-${(0, react_1.useId)()}`;
    const { state, descriptors, navigation, ...rest } = (0, native_1.useNavigationBuilder)(Tabs_router_1.TabRouter, {
        children,
        backBehavior: react_native_1.Platform.OS === 'web' ? 'history' : 'firstRoute',
        ...options,
        initialRouteName,
        key,
    });
    const routes = Object.fromEntries(state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        const action = {
            ...options.action,
            target: state.key,
        };
        return [
            '/',
            {
                route,
                action,
                key: route.key,
                isFocused: state.index === index,
                props: {
                    key: route.key,
                    onPress: () => {
                        const isFocused = state.index === index;
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.dispatch(action);
                        }
                    },
                },
            },
        ];
    }));
    return { state, descriptors, navigation, routes, ...rest };
}
exports.useTabs = useTabs;
function isTabListOrFragment(child) {
    return (0, react_1.isValidElement)(child) && (child.type === Tabs_bar_1.TabList || child.type === react_1.Fragment);
}
function isTabTrigger(child) {
    return (0, react_1.isValidElement)(child) && child.type === Tabs_bar_1.TabTrigger;
}
function parseTriggersFromChildren(children, screenTriggers = []) {
    react_1.Children.forEach(children, (child) => {
        if (isTabListOrFragment(child)) {
            return parseTriggersFromChildren(child.props.children, screenTriggers);
        }
        if (!isTabTrigger(child)) {
            return;
        }
        let { href, initialRoute } = child.props;
        href = (0, href_1.resolveHref)(href);
        if ((0, url_1.shouldLinkExternally)(href)) {
            return;
        }
        screenTriggers.push({ href, initialRoute });
        return;
    });
    return screenTriggers;
}
function triggersToScreens(triggers, layoutRouteNode, linking) {
    let initialRouteName;
    const screenConfig = triggers.reduce((acc, { href, initialRoute }, index) => {
        let state = linking.getStateFromPath?.(href, linking.config)?.routes[0];
        if (!state) {
            return acc;
        }
        if (layoutRouteNode.route) {
            while (state?.state) {
                const previousState = state;
                state = state.state.routes[0];
                if (previousState.name === layoutRouteNode.route)
                    break;
            }
        }
        let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);
        if (routeNode) {
            const key = `${routeNode.route}#${index}`;
            if (initialRoute) {
                initialRouteName = routeNode.route;
            }
            acc.push({ routeNode, key });
        }
        return acc;
    }, []);
    const sortFn = (0, sortRoutes_1.sortRoutesWithInitial)(initialRouteName);
    const children = screenConfig
        .sort((a, b) => sortFn(a.routeNode, b.routeNode))
        .map(({ routeNode, key }) => (<Screen key={key} name={key} getComponent={() => (0, useScreens_1.getQualifiedRouteComponent)(routeNode)}/>));
    return {
        children,
        initialRouteName,
    };
}
function Tabs({ children, ...props }) {
    const tabs = useTabs({ triggers: parseTriggersFromChildren(children) });
    const NavigationContent = tabs.NavigationContent;
    return (<Tabs_common_1.TabsContext.Provider value={tabs}>
      <react_native_1.View style={styles.tabsRoot} {...props}>
        <NavigationContent>{children}</NavigationContent>
      </react_native_1.View>
    </Tabs_common_1.TabsContext.Provider>);
}
exports.Tabs = Tabs;
const styles = react_native_1.StyleSheet.create({
    tabsRoot: {
        flex: 1,
    },
});
//# sourceMappingURL=Tabs.js.map