"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStackNavigator = createStackNavigator;
const jsx_runtime_1 = require("react/jsx-runtime");
const core_1 = require("../../core");
const StackNavigator = (props) => {
    const { state, descriptors, NavigationContent } = (0, core_1.useNavigationBuilder)(core_1.StackRouter, props);
    return ((0, jsx_runtime_1.jsx)(NavigationContent, { children: descriptors[state.routes[state.index].key].render() }));
};
function createStackNavigator() {
    return (0, core_1.createNavigatorFactory)(StackNavigator)();
}
//# sourceMappingURL=createStackNavigator.js.map