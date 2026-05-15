"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarSpacer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const native_1 = require("../../../../toolbar/native");
/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
const NativeToolbarSpacer = (props) => {
    const id = (0, react_1.useId)();
    return ((0, jsx_runtime_1.jsx)(native_1.RouterToolbarItem, { hidesSharedBackground: props.hidesSharedBackground, hidden: props.hidden, identifier: id, sharesBackground: props.sharesBackground, type: props.width ? 'fixedSpacer' : 'fluidSpacer', width: props.width }));
};
exports.NativeToolbarSpacer = NativeToolbarSpacer;
//# sourceMappingURL=native.ios.js.map