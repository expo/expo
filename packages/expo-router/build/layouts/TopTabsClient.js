"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopTabs = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const withLayoutContext_1 = require("./withLayoutContext");
const material_top_tabs_1 = require("../react-navigation/material-top-tabs");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
const MaterialTopTabNavigator = (0, material_top_tabs_1.createMaterialTopTabNavigator)().Navigator;
const MaterialTopTabs = (0, withLayoutContext_1.withLayoutContext)(MaterialTopTabNavigator);
/**
 * Renders a material top tab navigator.
 *
 * @hideType
 */
const TopTabs = Object.assign((props) => {
    return (0, jsx_runtime_1.jsx)(MaterialTopTabs, { ...props });
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
exports.TopTabs = TopTabs;
exports.default = TopTabs;
//# sourceMappingURL=TopTabsClient.js.map