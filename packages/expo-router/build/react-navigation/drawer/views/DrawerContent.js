"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerContent = DrawerContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const DrawerContentScrollView_1 = require("./DrawerContentScrollView");
const DrawerItemList_1 = require("./DrawerItemList");
function DrawerContent({ descriptors, state, ...rest }) {
    const focusedRoute = state.routes[state.index];
    const focusedDescriptor = descriptors[focusedRoute.key];
    const focusedOptions = focusedDescriptor.options;
    const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;
    return ((0, jsx_runtime_1.jsx)(DrawerContentScrollView_1.DrawerContentScrollView, { ...rest, contentContainerStyle: drawerContentContainerStyle, style: drawerContentStyle, children: (0, jsx_runtime_1.jsx)(DrawerItemList_1.DrawerItemList, { descriptors: descriptors, state: state, ...rest }) }));
}
//# sourceMappingURL=DrawerContent.js.map