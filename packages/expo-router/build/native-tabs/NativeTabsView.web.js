"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_tabs_1 = require("@radix-ui/react-tabs");
const react_1 = require("react");
const native_tabs_module_css_1 = __importDefault(require("../../assets/native-tabs.module.css"));
function NativeTabsView(props) {
    const { tabs, focusedIndex } = props;
    const currentTab = tabs[focusedIndex];
    const defaultTab = (0, react_1.useMemo)(() => currentTab, 
    // We don't specify currentTab here, as we don't want to change the default tab when focusedIndex changes
    []);
    const value = currentTab.routeKey;
    const items = tabs.map((tab) => ((0, jsx_runtime_1.jsx)(TabItem, { routeKey: tab.routeKey, title: tab.options.title ?? tab.name, badgeValue: tab.options.badgeValue }, tab.routeKey)));
    const children = tabs.map((tab) => {
        return ((0, jsx_runtime_1.jsx)(react_tabs_1.TabsContent, { value: tab.routeKey, className: native_tabs_module_css_1.default.tabContent, forceMount: true, children: tab.contentRenderer() }, tab.routeKey));
    });
    return ((0, jsx_runtime_1.jsxs)(react_tabs_1.Tabs, { className: native_tabs_module_css_1.default.nativeTabsContainer, defaultValue: defaultTab.routeKey, value: value, onValueChange: (value) => {
            props.onTabChange(value);
        }, style: convertNativeTabsPropsToStyleVars(props, currentTab.options), children: [(0, jsx_runtime_1.jsx)(react_tabs_1.TabsList, { "aria-label": "Main", className: native_tabs_module_css_1.default.navigationMenuRoot, children: items }), children] }));
}
function TabItem(props) {
    const { title, badgeValue, routeKey } = props;
    const isBadgeEmpty = badgeValue === ' ';
    return ((0, jsx_runtime_1.jsxs)(react_tabs_1.TabsTrigger, { value: routeKey, className: native_tabs_module_css_1.default.navigationMenuTrigger, children: [(0, jsx_runtime_1.jsx)("span", { className: native_tabs_module_css_1.default.tabText, children: title }), badgeValue && ((0, jsx_runtime_1.jsx)("div", { className: `${native_tabs_module_css_1.default.tabBadge} ${isBadgeEmpty ? native_tabs_module_css_1.default.emptyTabBadge : ''}`, children: badgeValue }))] }));
}
function convertNativeTabsPropsToStyleVars(props, currentTabOptions) {
    const vars = {};
    if (!props) {
        return vars;
    }
    const optionsLabelStyle = currentTabOptions?.labelStyle;
    if (optionsLabelStyle?.fontFamily) {
        vars['--expo-router-tabs-font-family'] = String(optionsLabelStyle.fontFamily);
    }
    if (optionsLabelStyle?.fontSize) {
        vars['--expo-router-tabs-font-size'] = String(optionsLabelStyle.fontSize);
    }
    if (optionsLabelStyle?.fontWeight) {
        vars['--expo-router-tabs-font-weight'] = String(optionsLabelStyle.fontWeight);
    }
    if (optionsLabelStyle?.fontStyle) {
        vars['--expo-router-tabs-font-style'] = String(optionsLabelStyle.fontStyle);
    }
    if (optionsLabelStyle?.color) {
        vars['--expo-router-tabs-text-color'] = String(optionsLabelStyle.color);
    }
    if (currentTabOptions?.selectedLabelStyle?.color) {
        vars['--expo-router-tabs-active-text-color'] = String(currentTabOptions?.selectedLabelStyle?.color);
    }
    else if (props.tintColor) {
        vars['--expo-router-tabs-active-text-color'] = String(props.tintColor);
    }
    if (currentTabOptions?.selectedLabelStyle?.fontSize) {
        vars['--expo-router-tabs-active-font-size'] = String(currentTabOptions?.selectedLabelStyle?.fontSize);
    }
    if (currentTabOptions?.indicatorColor) {
        vars['--expo-router-tabs-active-background-color'] = String(currentTabOptions.indicatorColor);
    }
    if (currentTabOptions?.backgroundColor) {
        vars['--expo-router-tabs-background-color'] = String(currentTabOptions.backgroundColor);
    }
    if (currentTabOptions?.badgeBackgroundColor) {
        vars['--expo-router-tabs-badge-background-color'] = String(currentTabOptions.badgeBackgroundColor);
    }
    if (currentTabOptions?.badgeTextColor) {
        vars['--expo-router-tabs-badge-text-color'] = String(currentTabOptions.badgeTextColor);
    }
    return vars;
}
//# sourceMappingURL=NativeTabsView.web.js.map