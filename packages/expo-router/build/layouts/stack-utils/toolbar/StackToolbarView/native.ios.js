"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const native_1 = require("../../../../toolbar/native");
/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
const NativeToolbarView = ({ children, hidden, hidesSharedBackground, separateBackground, }) => {
    const id = (0, react_1.useId)();
    return ((0, jsx_runtime_1.jsx)(native_1.RouterToolbarItem, { hidesSharedBackground: hidesSharedBackground, hidden: hidden, identifier: id, sharesBackground: !separateBackground, children: children }));
};
exports.NativeToolbarView = NativeToolbarView;
//# sourceMappingURL=native.ios.js.map