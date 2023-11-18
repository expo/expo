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
exports.LogBoxInspectorMessageHeader = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const LogBoxMessage_1 = require("../UI/LogBoxMessage");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
const SHOW_MORE_MESSAGE_LENGTH = 300;
function ShowMoreButton({ message, collapsed, onPress, }) {
    if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
        return null;
    }
    return (react_1.default.createElement(react_native_1.Text, { style: styles.collapse, onPress: onPress }, "... See More"));
}
function LogBoxInspectorMessageHeader(props) {
    return (react_1.default.createElement(react_native_1.View, { style: styles.body },
        react_1.default.createElement(react_native_1.View, { style: styles.heading },
            react_1.default.createElement(react_native_1.Text, { style: [styles.headingText, styles[props.level]] }, props.title)),
        react_1.default.createElement(react_native_1.Text, { style: styles.bodyText },
            react_1.default.createElement(LogBoxMessage_1.LogBoxMessage, { maxLength: props.collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity, message: props.message, style: styles.messageText }),
            react_1.default.createElement(ShowMoreButton, { ...props }))));
}
exports.LogBoxInspectorMessageHeader = LogBoxInspectorMessageHeader;
const styles = react_native_1.StyleSheet.create({
    body: {
        backgroundColor: LogBoxStyle.getBackgroundColor(1),
        ...react_native_1.Platform.select({
            web: {
                boxShadow: `0 2px 0 2px #00000080`,
            },
        }),
    },
    bodyText: {
        color: LogBoxStyle.getTextColor(1),
        fontSize: 14,
        includeFontPadding: false,
        lineHeight: 20,
        fontWeight: '500',
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    heading: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 12,
        marginTop: 10,
        marginBottom: 5,
    },
    headingText: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        includeFontPadding: false,
        lineHeight: 28,
    },
    warn: {
        color: LogBoxStyle.getWarningColor(1),
    },
    error: {
        color: LogBoxStyle.getErrorColor(1),
    },
    fatal: {
        color: LogBoxStyle.getFatalColor(1),
    },
    syntax: {
        color: LogBoxStyle.getFatalColor(1),
    },
    static: {
        color: LogBoxStyle.getFatalColor(1),
    },
    messageText: {
        color: LogBoxStyle.getTextColor(0.6),
    },
    collapse: {
        color: LogBoxStyle.getTextColor(0.7),
        fontSize: 14,
        fontWeight: '300',
        lineHeight: 12,
    },
    button: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 3,
    },
});
//# sourceMappingURL=LogBoxInspectorMessageHeader.js.map