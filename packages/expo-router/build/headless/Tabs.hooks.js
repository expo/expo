"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTabsWithTriggers = exports.useTabsWithChildren = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const Tabs_common_1 = require("./Tabs.common");
const Tabs_list_1 = require("./Tabs.list");
const Tabs_slot_1 = require("./Tabs.slot");
const common_1 = require("./common");
const Route_1 = require("../Route");
const href_1 = require("../link/href");
const url_1 = require("../utils/url");
function useTabsWithChildren({ children, ...options }) {
    return useTabsWithTriggers({ triggers: parseTriggersFromChildren(children), ...options });
}
exports.useTabsWithChildren = useTabsWithChildren;
function useTabsWithTriggers({ triggers, ...options }) {
    const routeNode = (0, Route_1.useRouteNode)();
    const contextKey = (0, Route_1.useContextKey)();
    const linking = (0, react_1.useContext)(native_1.LinkingContext).options;
    if (!routeNode || !linking) {
        throw new Error('No RouteNode. This is likely a bug in expo-router.');
    }
    const initialRouteName = routeNode.initialRouteName;
    const { children } = (0, common_1.triggersToScreens)(triggers, routeNode, linking, initialRouteName);
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.TabRouter, {
        children,
        backBehavior: react_native_1.Platform.OS === 'web' ? 'history' : 'firstRoute',
        ...options,
        id: contextKey,
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
    const navigationContent = (props) => {
        return (<Tabs_common_1.TabsDescriptorsContext.Provider value={descriptors}>
        <Tabs_common_1.TabsStateContext.Provider value={state}>
          <NavigationContent {...props}/>
        </Tabs_common_1.TabsStateContext.Provider>
      </Tabs_common_1.TabsDescriptorsContext.Provider>);
    };
    return { state, descriptors, navigation, routes, NavigationContent: navigationContent };
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
        let { href } = child.props;
        href = (0, href_1.resolveHref)(href);
        if ((0, url_1.shouldLinkExternally)(href)) {
            return;
        }
        return screenTriggers.push({ href });
    });
    return screenTriggers;
}
//# sourceMappingURL=Tabs.hooks.js.map