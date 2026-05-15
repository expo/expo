"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarSpacer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_ui_1 = require("../../../../optional-dependencies/expo-ui");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
const NativeToolbarSpacer = (props) => {
    if (!props.width) {
        return null;
    }
    const { Box } = (0, expo_ui_1.getExpoUiJetpackCompose)('`Stack.Toolbar.Spacer` on Android');
    const { width } = (0, expo_ui_1.getExpoUiJetpackComposeModifiers)('`Stack.Toolbar.Spacer` on Android');
    return ((0, jsx_runtime_1.jsx)(AnimatedItemContainer_1.AnimatedItemContainer, { visible: !props.hidden, children: (0, jsx_runtime_1.jsx)(Box, { modifiers: [width(props.width)] }) }));
};
exports.NativeToolbarSpacer = NativeToolbarSpacer;
//# sourceMappingURL=native.android.js.map