"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarMenuAction = exports.NativeToolbarMenu = void 0;
/**
 * Toolbar menus are not supported on Android.
 */
const NativeToolbarMenu = () => null;
exports.NativeToolbarMenu = NativeToolbarMenu;
/**
 * Toolbar menu actions are not supported on Android.
 */
const NativeToolbarMenuAction = (_props) => null;
exports.NativeToolbarMenuAction = NativeToolbarMenuAction;
//# sourceMappingURL=native.android.js.map