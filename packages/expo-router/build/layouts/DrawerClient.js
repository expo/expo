'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = void 0;
const drawer_1 = require("@react-navigation/drawer");
const withLayoutContext_1 = require("./withLayoutContext");
const DrawerNavigator = (0, drawer_1.createDrawerNavigator)().Navigator;
exports.Drawer = (0, withLayoutContext_1.withLayoutContext)(DrawerNavigator);
exports.default = exports.Drawer;
//# sourceMappingURL=DrawerClient.js.map