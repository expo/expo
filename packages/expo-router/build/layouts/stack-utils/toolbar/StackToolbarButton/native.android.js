"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_ui_1 = require("../../../../optional-dependencies/expo-ui");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
const context_1 = require("../context");
const defaults_1 = require("../defaults");
/**
 * Native toolbar button component for Android bottom toolbar.
 * Renders as an IconButton with animated visibility.
 */
const NativeToolbarButton = (props) => {
    const toolbarColors = (0, context_1.useToolbarColors)();
    if (!props.source) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
        }
        return null;
    }
    const { IconButton, Icon } = (0, expo_ui_1.getExpoUiJetpackCompose)('`Stack.Toolbar.Button` on Android');
    const tintColor = props.imageRenderingMode === 'original'
        ? undefined
        : (props.tintColor ?? toolbarColors.tintColor ?? (0, defaults_1.DEFAULT_TOOLBAR_TINT_COLOR)());
    return ((0, jsx_runtime_1.jsx)(AnimatedItemContainer_1.AnimatedItemContainer, { visible: !props.hidden, children: (0, jsx_runtime_1.jsx)(IconButton, { onClick: props.onPress, enabled: !props.disabled, children: (0, jsx_runtime_1.jsx)(Icon, { source: props.source, tint: tintColor, size: 24, contentDescription: props.accessibilityLabel }) }) }));
};
exports.NativeToolbarButton = NativeToolbarButton;
//# sourceMappingURL=native.android.js.map