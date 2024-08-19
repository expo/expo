"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTabTrigger = exports.useTabsWithTriggers = exports.useTabsWithChildren = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const Tab_shared_1 = require("./Tab-shared");
const TabList_1 = require("./TabList");
const TabRouter_1 = require("./TabRouter");
const TabSlot_1 = require("./TabSlot");
const common_1 = require("./common");
const useComponent_1 = require("./useComponent");
const Route_1 = require("../Route");
const href_1 = require("../link/href");
const useNavigation_1 = require("../useNavigation");
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
    const { children, triggerMap } = (0, common_1.triggersToScreens)(triggers, routeNode, linking, initialRouteName);
    const { state, descriptors, navigation, NavigationContent: RNNavigationContent, } = (0, native_1.useNavigationBuilder)(TabRouter_1.TabRouter, {
        children,
        backBehavior: react_native_1.Platform.OS === 'web' ? 'history' : 'firstRoute',
        ...options,
        triggerMap,
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
    const NavigationContent = (0, useComponent_1.useComponent)((children) => (<Tab_shared_1.TabsDescriptorsContext.Provider value={descriptors}>
      <Tab_shared_1.TabsStateContext.Provider value={state}>
        <RNNavigationContent>{children}</RNNavigationContent>
      </Tab_shared_1.TabsStateContext.Provider>
    </Tab_shared_1.TabsDescriptorsContext.Provider>));
    return { state, descriptors, navigation, routes, NavigationContent };
}
exports.useTabsWithTriggers = useTabsWithTriggers;
function useTabTrigger() {
    const navigation = (0, useNavigation_1.useNavigation)();
    const switchTab = (0, react_1.useCallback)((name, href) => {
        return navigation.dispatch({
            type: 'SWITCH_TABS',
            payload: {
                name,
                href,
            },
        });
    }, [navigation]);
    return {
        switchTab,
    };
}
exports.useTabTrigger = useTabTrigger;
function isFragment(child) {
    return child.type === react_1.Fragment;
}
function isTabList(child) {
    return child.type === TabList_1.TabList;
}
function isTabTrigger(child) {
    return child.type === TabList_1.TabTrigger;
}
function isTabSlot(child) {
    return child.type === TabSlot_1.TabSlot;
}
function parseTriggersFromChildren(children, screenTriggers = [], isInTabList = false) {
    react_1.Children.forEach(children, (child) => {
        if (!child || !(0, react_1.isValidElement)(child) || isTabSlot(child)) {
            return;
        }
        if (isFragment(child) && typeof child.props.children !== 'function') {
            return parseTriggersFromChildren(child.props.children, screenTriggers, isInTabList || isTabList(child));
        }
        if (isTabList(child) && typeof child.props.children !== 'function') {
            let children = child.props.children;
            // <TabList asChild /> adds an extra layer. We need to parse the child's children
            if (child.props.asChild && (0, react_1.isValidElement)(children)) {
                children = children.props.children;
            }
            return parseTriggersFromChildren(children, screenTriggers, isInTabList || isTabList(child));
        }
        // We should only process TabTriggers within the TabList. All other components will be ignored
        if (!isInTabList || !isTabTrigger(child)) {
            return;
        }
        const { href, name } = child.props;
        if (!href) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`<TabTrigger name={${name}}> does not have a 'href' prop. TabTriggers within a <TabList /> are required to have a href.`);
            }
            return;
        }
        if ((0, url_1.shouldLinkExternally)((0, href_1.resolveHref)(href))) {
            return;
        }
        if (!name) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`<TabTrigger> does not have a 'name' prop. TabTriggers within a <TabList /> are required to have a name.`);
            }
            return;
        }
        return screenTriggers.push({ href, name });
    });
    return screenTriggers;
}
//# sourceMappingURL=Tab-hooks.js.map