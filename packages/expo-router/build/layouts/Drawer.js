"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = exports.useDrawerProgress = exports.useDrawerStatus = exports.getDrawerStatusFromState = exports.DrawerView = exports.DrawerToggleButton = exports.DrawerItemList = exports.DrawerItem = exports.DrawerContentScrollView = exports.DrawerContent = void 0;
const DrawerClient_1 = __importDefault(require("./DrawerClient"));
exports.Drawer = DrawerClient_1.default;
const Screen_1 = require("../views/Screen");
// Re-export the drawer building blocks (content components, items, types, etc.) from the
// vendored react-navigation so apps can build custom `drawerContent` without depending on
// `@react-navigation/drawer` directly. See https://github.com/expo/expo/issues/46161
// `createDrawerNavigator` is intentionally omitted — use the `Drawer` layout instead.
// The `DrawerStatusContext`/`DrawerProgressContext` contexts are also omitted — use the
// `useDrawerStatus`/`useDrawerProgress` hooks instead.
var drawer_1 = require("../react-navigation/drawer");
Object.defineProperty(exports, "DrawerContent", { enumerable: true, get: function () { return drawer_1.DrawerContent; } });
Object.defineProperty(exports, "DrawerContentScrollView", { enumerable: true, get: function () { return drawer_1.DrawerContentScrollView; } });
Object.defineProperty(exports, "DrawerItem", { enumerable: true, get: function () { return drawer_1.DrawerItem; } });
Object.defineProperty(exports, "DrawerItemList", { enumerable: true, get: function () { return drawer_1.DrawerItemList; } });
Object.defineProperty(exports, "DrawerToggleButton", { enumerable: true, get: function () { return drawer_1.DrawerToggleButton; } });
Object.defineProperty(exports, "DrawerView", { enumerable: true, get: function () { return drawer_1.DrawerView; } });
Object.defineProperty(exports, "getDrawerStatusFromState", { enumerable: true, get: function () { return drawer_1.getDrawerStatusFromState; } });
Object.defineProperty(exports, "useDrawerStatus", { enumerable: true, get: function () { return drawer_1.useDrawerStatus; } });
Object.defineProperty(exports, "useDrawerProgress", { enumerable: true, get: function () { return drawer_1.useDrawerProgress; } });
DrawerClient_1.default.Screen = Screen_1.Screen;
exports.default = DrawerClient_1.default;
//# sourceMappingURL=Drawer.js.map