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
exports.useTabsWithTriggers = exports.useTabsWithChildren = exports.Tabs = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const TabContext_1 = require("./TabContext");
const TabList_1 = require("./TabList");
const TabRouter_1 = require("./TabRouter");
const TabSlot_1 = require("./TabSlot");
const TabTrigger_1 = require("./TabTrigger");
const common_1 = require("./common");
const useComponent_1 = require("./useComponent");
const Route_1 = require("../Route");
const hooks_1 = require("../hooks");
const href_1 = require("../link/href");
const url_1 = require("../utils/url");
__exportStar(require("./TabContext"), exports);
__exportStar(require("./TabList"), exports);
__exportStar(require("./TabSlot"), exports);
__exportStar(require("./TabTrigger"), exports);
function Tabs({ children, asChild, options, ...props }) {
    const Comp = asChild ? common_1.SafeAreaViewSlot : react_native_1.View;
    const { NavigationContent } = useTabsWithChildren({
        // asChild adds an extra layer, so we need to process the child's children
        children: asChild && (0, react_1.isValidElement)(children) ? children.props.children : children,
        ...options,
    });
    return (<Comp style={styles.tabsRoot} {...props}>
      <NavigationContent>{children}</NavigationContent>
    </Comp>);
}
exports.Tabs = Tabs;
function useTabsWithChildren({ children, ...options }) {
    return useTabsWithTriggers({ triggers: parseTriggersFromChildren(children), ...options });
}
exports.useTabsWithChildren = useTabsWithChildren;
function useTabsWithTriggers({ triggers, ...options }) {
    // Ensure we extend the parent triggers, so we can trigger them as well
    const parentTriggerMap = (0, react_1.useContext)(TabContext_1.TabTriggerMapContext);
    const routeNode = (0, Route_1.useRouteNode)();
    const contextKey = (0, Route_1.useContextKey)();
    const linking = (0, react_1.useContext)(native_1.LinkingContext).options;
    const routeInfo = (0, hooks_1.useRouteInfo)();
    if (!routeNode || !linking) {
        throw new Error('No RouteNode. This is likely a bug in expo-router.');
    }
    const initialRouteName = routeNode.initialRouteName;
    const { children, triggerMap } = (0, common_1.triggersToScreens)(triggers, routeNode, linking, initialRouteName, parentTriggerMap, routeInfo, contextKey);
    const { state, descriptors, navigation, NavigationContent: RNNavigationContent, } = (0, native_1.useNavigationBuilder)(TabRouter_1.ExpoTabRouter, {
        children,
        ...options,
        triggerMap,
        id: contextKey,
        initialRouteName,
    });
    const NavigationContent = (0, useComponent_1.useComponent)((children) => (<TabContext_1.TabTriggerMapContext.Provider value={triggerMap}>
      <TabContext_1.TabsNavigatorContext.Provider value={navigation}>
        <TabContext_1.TabsDescriptorsContext.Provider value={descriptors}>
          <TabContext_1.TabsStateContext.Provider value={state}>
            <RNNavigationContent>{children}</RNNavigationContent>
          </TabContext_1.TabsStateContext.Provider>
        </TabContext_1.TabsDescriptorsContext.Provider>
      </TabContext_1.TabsNavigatorContext.Provider>
    </TabContext_1.TabTriggerMapContext.Provider>));
    return { state, descriptors, navigation, NavigationContent };
}
exports.useTabsWithTriggers = useTabsWithTriggers;
function parseTriggersFromChildren(children, screenTriggers = [], isInTabList = false) {
    react_1.Children.forEach(children, (child) => {
        if (!child || !(0, react_1.isValidElement)(child) || (0, TabSlot_1.isTabSlot)(child)) {
            return;
        }
        if (isFragment(child) && typeof child.props.children !== 'function') {
            return parseTriggersFromChildren(child.props.children, screenTriggers, isInTabList || (0, TabList_1.isTabList)(child));
        }
        if ((0, TabList_1.isTabList)(child) && typeof child.props.children !== 'function') {
            let children = child.props.children;
            // <TabList asChild /> adds an extra layer. We need to parse the child's children
            if (child.props.asChild && (0, react_1.isValidElement)(children)) {
                children = children.props.children;
            }
            return parseTriggersFromChildren(children, screenTriggers, isInTabList || (0, TabList_1.isTabList)(child));
        }
        // We should only process TabTriggers within the TabList. All other components will be ignored
        if (!isInTabList || !(0, TabTrigger_1.isTabTrigger)(child)) {
            return;
        }
        const { href, name } = child.props;
        if (!href) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`<TabTrigger name={${name}}> does not have a 'href' prop. TabTriggers within a <TabList /> are required to have a href.`);
            }
            return;
        }
        const resolvedHref = (0, href_1.resolveHref)(href);
        if ((0, url_1.shouldLinkExternally)(resolvedHref)) {
            return screenTriggers.push({
                type: 'external',
                name,
                href: resolvedHref,
            });
        }
        if (!name) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`<TabTrigger> does not have a 'name' prop. TabTriggers within a <TabList /> are required to have a name.`);
            }
            return;
        }
        return screenTriggers.push({ type: 'internal', href: resolvedHref, name });
    });
    return screenTriggers;
}
function isFragment(child) {
    return child.type === react_1.Fragment;
}
const styles = react_native_1.StyleSheet.create({
    tabsRoot: {
        flex: 1,
    },
});
//# sourceMappingURL=Tabs.js.map