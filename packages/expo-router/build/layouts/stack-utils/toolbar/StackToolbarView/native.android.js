"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_ui_1 = require("../../../../optional-dependencies/expo-ui");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
const context_1 = require("../context");
const NativeToolbarView = ({ children, hidden }) => {
    const { Box, RNHostView } = (0, expo_ui_1.getExpoUiJetpackCompose)('`Stack.Toolbar.View` on Android');
    const { fillMaxHeight } = (0, expo_ui_1.getExpoUiJetpackComposeModifiers)('`Stack.Toolbar.View` on Android');
    const placement = (0, context_1.useToolbarPlacement)();
    const modifiers = placement === 'bottom' ? [fillMaxHeight()] : undefined;
    return ((0, jsx_runtime_1.jsx)(Box, { contentAlignment: "center", modifiers: modifiers, children: (0, jsx_runtime_1.jsx)(AnimatedItemContainer_1.AnimatedItemContainer, { visible: !hidden, children: (0, jsx_runtime_1.jsx)(RNHostView, { matchContents: true, children: (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children }) }) }) }));
};
exports.NativeToolbarView = NativeToolbarView;
//# sourceMappingURL=native.android.js.map