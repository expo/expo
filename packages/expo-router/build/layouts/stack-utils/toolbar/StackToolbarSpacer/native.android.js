"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarSpacer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
const NativeToolbarSpacer = (props) => {
    if (!props.width) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(AnimatedItemContainer_1.AnimatedItemContainer, { visible: !props.hidden, children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Box, { modifiers: [(0, modifiers_1.width)(props.width)] }) }));
};
exports.NativeToolbarSpacer = NativeToolbarSpacer;
//# sourceMappingURL=native.android.js.map