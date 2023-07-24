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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBoxInspectorStackFrame = void 0;
/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const LogBoxButton_1 = require("../UI/LogBoxButton");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
const constants_1 = require("../UI/constants");
const formatProjectFilePath_1 = require("../formatProjectFilePath");
function LogBoxInspectorStackFrame(props) {
    const { frame, onPress } = props;
    const location = (0, formatProjectFilePath_1.getStackFormattedLocation)(process.env.EXPO_PROJECT_ROOT, frame);
    return (react_1.default.createElement(react_native_1.View, { style: styles.frameContainer },
        react_1.default.createElement(LogBoxButton_1.LogBoxButton, { backgroundColor: {
                default: "transparent",
                pressed: onPress ? LogBoxStyle.getBackgroundColor(1) : "transparent",
            }, onPress: onPress, style: styles.frame },
            react_1.default.createElement(react_native_1.Text, { style: [styles.name, frame.collapse === true && styles.dim] }, frame.methodName),
            react_1.default.createElement(react_native_1.Text, { ellipsizeMode: "middle", numberOfLines: 1, style: [styles.location, frame.collapse === true && styles.dim] }, location))));
}
exports.LogBoxInspectorStackFrame = LogBoxInspectorStackFrame;
const styles = react_native_1.StyleSheet.create({
    frameContainer: {
        flexDirection: "row",
        paddingHorizontal: 15,
    },
    frame: {
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    lineLocation: {
        flexDirection: "row",
    },
    name: {
        color: LogBoxStyle.getTextColor(1),
        fontSize: 14,
        includeFontPadding: false,
        lineHeight: 18,
        fontWeight: "400",
        fontFamily: constants_1.CODE_FONT,
    },
    location: {
        color: LogBoxStyle.getTextColor(0.8),
        fontSize: 12,
        fontWeight: "300",
        includeFontPadding: false,
        lineHeight: 16,
        paddingLeft: 10,
    },
    dim: {
        color: LogBoxStyle.getTextColor(0.4),
        fontWeight: "300",
    },
    line: {
        color: LogBoxStyle.getTextColor(0.8),
        fontSize: 12,
        fontWeight: "300",
        includeFontPadding: false,
        lineHeight: 16,
    },
});
//# sourceMappingURL=LogBoxInspectorStackFrame.js.map