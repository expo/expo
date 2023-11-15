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
exports.LogBoxInspectorFooter = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const LogContext_1 = require("../Data/LogContext");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
function LogBoxInspectorFooter(props) {
    const log = (0, LogContext_1.useSelectedLog)();
    if (['static', 'syntax'].includes(log.level)) {
        return (react_1.default.createElement(react_native_1.View, { style: styles.root },
            react_1.default.createElement(react_native_1.View, { style: styles.button },
                react_1.default.createElement(react_native_1.Text, { style: styles.syntaxErrorText }, "This error cannot be dismissed."))));
    }
    return (react_1.default.createElement(react_native_1.View, { style: styles.root },
        react_1.default.createElement(FooterButton, { text: "Dismiss", onPress: props.onDismiss }),
        react_1.default.createElement(FooterButton, { text: "Minimize", onPress: props.onMinimize })));
}
exports.LogBoxInspectorFooter = LogBoxInspectorFooter;
function FooterButton({ text, onPress }) {
    return (react_1.default.createElement(react_native_1.Pressable, { onPress: onPress, style: { flex: 1 } }, ({ 
    /** @ts-expect-error: react-native types are broken. */
    hovered, pressed, }) => (react_1.default.createElement(react_native_1.View, { style: [
            buttonStyles.safeArea,
            {
                // @ts-expect-error: web-only type
                transitionDuration: '150ms',
                backgroundColor: pressed
                    ? '#323232'
                    : hovered
                        ? '#111111'
                        : LogBoxStyle.getBackgroundColor(),
            },
        ] },
        react_1.default.createElement(react_native_1.View, { style: buttonStyles.content },
            react_1.default.createElement(react_native_1.Text, { style: buttonStyles.label }, text))))));
}
const buttonStyles = react_native_1.StyleSheet.create({
    safeArea: {
        flex: 1,
        borderTopWidth: 1,
        borderColor: '#323232',
        // paddingBottom: DeviceInfo.getConstants().isIPhoneX_deprecated ? 30 : 0,
    },
    content: {
        alignItems: 'center',
        height: 48,
        justifyContent: 'center',
    },
    label: {
        userSelect: 'none',
        color: LogBoxStyle.getTextColor(1),
        fontSize: 14,
        includeFontPadding: false,
        lineHeight: 20,
    },
});
const styles = react_native_1.StyleSheet.create({
    root: {
        backgroundColor: LogBoxStyle.getBackgroundColor(1),
        ...react_native_1.Platform.select({
            web: {
                boxShadow: `0 -2px 0 2px #000`,
            },
        }),
        flexDirection: 'row',
    },
    button: {
        flex: 1,
    },
    syntaxErrorText: {
        textAlign: 'center',
        width: '100%',
        height: 48,
        fontSize: 14,
        lineHeight: 20,
        paddingTop: 20,
        paddingBottom: 50,
        fontStyle: 'italic',
        color: LogBoxStyle.getTextColor(0.6),
    },
});
//# sourceMappingURL=LogBoxInspectorFooter.js.map