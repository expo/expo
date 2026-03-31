"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopTabs = void 0;
const react_1 = __importDefault(require("react"));
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
    return <MaterialTopTabs {...props}/>;
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
exports.TopTabs = TopTabs;
exports.default = TopTabs;
//# sourceMappingURL=TopTabsClient.js.map