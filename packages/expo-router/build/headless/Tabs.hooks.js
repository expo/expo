"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTabsWithTriggers = exports.useTabsWithChildren = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const Tabs_common_1 = require("./Tabs.common");
const Route_1 = require("../Route");
const href_1 = require("../link/href");
const url_1 = require("../utils/url");
const Tabs_list_1 = require("./Tabs.list");
const Tabs_slot_1 = require("./Tabs.slot");
const common_1 = require("./common");
function useTabsWithChildren({ children, ...options }) {
    return useTabsWithTriggers({ triggers: parseTriggersFromChildren(children), ...options });
}
exports.useTabsWithChildren = useTabsWithChildren;
function useTabsWithTriggers({ triggers, ...options }) {
    const routeNode = (0, Route_1.useRouteNode)();
    const linking = (0, react_1.useContext)(native_1.LinkingContext).options;
    if (!routeNode || !linking) {
        throw new Error('No RouteNode. This is likely a bug in expo-router.');
    }
    const { children, initialRouteName } = (0, common_1.triggersToScreens)(triggers, routeNode, linking);
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.TabRouter, {
        children,
        backBehavior: react_native_1.Platform.OS === 'web' ? 'history' : 'firstRoute',
        ...options,
        initialRouteName,
    });
    const routes = Object.fromEntries(state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        const action = {
            ...options.action,
            target: state.key,
        };
        return [
            route.name,
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
    const newNavigationContent = (0, react_1.useCallback)((props) => {
        return (<Tabs_common_1.TabsContext.Provider value={{ state, descriptors, navigation, NavigationContent }}>
          <NavigationContent {...props}/>
        </Tabs_common_1.TabsContext.Provider>);
    }, [state, descriptors, navigation, routes, NavigationContent]);
    return { state, descriptors, navigation, routes, NavigationContent: newNavigationContent };
}
exports.useTabsWithTriggers = useTabsWithTriggers;
function isTabListOrFragment(child) {
    return (0, react_1.isValidElement)(child) && (child.type === Tabs_list_1.TabList || child.type === react_1.Fragment);
}
function isTabTrigger(child) {
    return (0, react_1.isValidElement)(child) && child.type === Tabs_list_1.TabTrigger;
}
function isTabSlot(child) {
    return (0, react_1.isValidElement)(child) && child.type === Tabs_slot_1.TabSlot;
}
function parseTriggersFromChildren(children, screenTriggers = []) {
    react_1.Children.forEach(children, (child) => {
        if (isTabListOrFragment(child)) {
            return parseTriggersFromChildren(child.props.children, screenTriggers);
        }
        if (!child || isTabSlot(child)) {
            return;
        }
        if (!isTabTrigger(child)) {
            if (!(0, react_1.isValidElement)(child)) {
                console.warn(`<Tabs /> only accepts <TabSlot /> and <TabTrigger /> as children. Found unknown component`);
            }
            else {
                console.warn(`<Tabs /> only accepts <TabSlot /> and <TabTrigger /> as children. Found component ${typeof child.type === 'string' ? child.type : child.type.name}`);
            }
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
//# sourceMappingURL=Tabs.hooks.js.map