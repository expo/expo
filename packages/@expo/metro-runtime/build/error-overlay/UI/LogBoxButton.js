"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBoxButton = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const LogBoxStyle = __importStar(require("./LogBoxStyle"));
function LogBoxButton(props) {
    const [pressed, setPressed] = (0, react_1.useState)(false);
    let backgroundColor = props.backgroundColor;
    if (!backgroundColor) {
        backgroundColor = {
            default: LogBoxStyle.getBackgroundColor(0.95),
            pressed: LogBoxStyle.getBackgroundColor(0.6),
        };
    }
    const content = (react_1.default.createElement(react_native_1.View, { style: [
            {
                backgroundColor: pressed ? backgroundColor.pressed : backgroundColor.default,
                ...react_native_1.Platform.select({
                    web: {
                        cursor: 'pointer',
                    },
                }),
            },
            props.style,
        ] }, props.children));
    return props.onPress == null ? (content) : (react_1.default.createElement(react_native_1.Pressable, { hitSlop: props.hitSlop, onPress: props.onPress, onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) }, content));
}
exports.LogBoxButton = LogBoxButton;
//# sourceMappingURL=LogBoxButton.js.map