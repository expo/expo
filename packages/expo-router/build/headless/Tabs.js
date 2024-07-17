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
const core_1 = require("@react-navigation/core");
const native_1 = require("@react-navigation/native");
const Tabs_common_1 = require("./Tabs.common");
const Route_1 = require("../Route");
const useScreens_1 = require("../useScreens");
const href_1 = require("../link/href");
const url_1 = require("../utils/url");
__exportStar(require("./Tabs.slot"), exports);
__exportStar(require("./Tabs.common"), exports);
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = (0, core_1.createNavigatorFactory)({})();
function useTabs({ hrefs, ...options }) {
    const routeNode = (0, Route_1.useRouteNode)();
    if (routeNode == null) {
        throw new Error('No RouteNode. This is likely a bug in expo-router.');
    }
    const children = hrefOptionsToScreens(routeNode, hrefs);
    return (0, native_1.useNavigationBuilder)(native_1.TabRouter, { children, ...options });
}
exports.useTabs = useTabs;
function Tabs({ children, ...options }) {
    const tabsContext = useTabs(options);
    const NavigationContent = tabsContext.NavigationContent;
    return (<Tabs_common_1.TabsContext.Provider value={tabsContext}>
      <NavigationContent>{children}</NavigationContent>
    </Tabs_common_1.TabsContext.Provider>);
}
exports.Tabs = Tabs;
function hrefOptionsToScreens(layoutRouteNode, hrefOptions) {
    const hrefEntries = Array.isArray(hrefOptions)
        ? hrefOptions.map((option) => (Array.isArray(option) ? option : [option, {}]))
        : Object.entries(hrefOptions);
    return hrefEntries.reduce((acc, [href, options], index) => {
        if (typeof href === 'string' &&
            'params' in options &&
            typeof options.params === 'object' &&
            options.params) {
            href = {
                pathname: href,
                params: options.params,
            };
        }
        const routeNode = hrefToRouteNode(layoutRouteNode, href, index);
        // If the href isn't valid, skip it
        if (!routeNode) {
            return acc;
        }
        acc.push(<Screen key={routeNode.contextKey} name={`${index}`} // The name needs to be unique, but we don't actually use it
         getComponent={() => (0, useScreens_1.getQualifiedRouteComponent)(routeNode)}/>);
        return acc;
    }, []);
}
function hrefToRouteNode(layoutRouteNode, href, index) {
    href = (0, href_1.resolveHref)(href);
    if ((0, url_1.shouldLinkExternally)(href)) {
        return null;
    }
    // You cannot navigate outside this layout
    if (href.startsWith('..')) {
        return null;
    }
    // TODO: Properly resolve the routeNode
    return layoutRouteNode.children[index];
}
//# sourceMappingURL=Tabs.js.map