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
exports.LogBoxInspectorHeader = void 0;
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
const LogBoxButton_1 = require("../UI/LogBoxButton");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
function LogBoxInspectorHeader(props) {
    const { selectedLogIndex: selectedIndex, logs } = (0, LogContext_1.useLogs)();
    const total = logs.length;
    if (props.level === 'syntax') {
        return (react_1.default.createElement(react_native_1.View, { style: [styles.safeArea, styles[props.level]] },
            react_1.default.createElement(react_native_1.View, { style: styles.header },
                react_1.default.createElement(react_native_1.View, { style: styles.title },
                    react_1.default.createElement(react_native_1.Text, { style: styles.titleText }, "Failed to compile")))));
    }
    const prevIndex = selectedIndex - 1 < 0 ? total - 1 : selectedIndex - 1;
    const nextIndex = selectedIndex + 1 > total - 1 ? 0 : selectedIndex + 1;
    const titleText = `Log ${selectedIndex + 1} of ${total}`;
    return (react_1.default.createElement(react_native_1.View, { style: [styles.safeArea, styles[props.level]] },
        react_1.default.createElement(react_native_1.View, { style: styles.header },
            react_1.default.createElement(LogBoxInspectorHeaderButton, { disabled: total <= 1, level: props.level, image: require('@expo/metro-runtime/assets/chevron-left.png'), onPress: () => props.onSelectIndex(prevIndex) }),
            react_1.default.createElement(react_native_1.View, { style: styles.title },
                react_1.default.createElement(react_native_1.Text, { style: styles.titleText }, titleText)),
            react_1.default.createElement(LogBoxInspectorHeaderButton, { disabled: total <= 1, level: props.level, image: require('@expo/metro-runtime/assets/chevron-right.png'), onPress: () => props.onSelectIndex(nextIndex) }))));
}
exports.LogBoxInspectorHeader = LogBoxInspectorHeader;
const backgroundForLevel = (level) => ({
    warn: {
        default: 'transparent',
        pressed: LogBoxStyle.getWarningDarkColor(),
    },
    error: {
        default: 'transparent',
        pressed: LogBoxStyle.getErrorDarkColor(),
    },
    fatal: {
        default: 'transparent',
        pressed: LogBoxStyle.getFatalDarkColor(),
    },
    syntax: {
        default: 'transparent',
        pressed: LogBoxStyle.getFatalDarkColor(),
    },
    static: {
        default: 'transparent',
        pressed: LogBoxStyle.getFatalDarkColor(),
    },
})[level];
function LogBoxInspectorHeaderButton(props) {
    return (react_1.default.createElement(LogBoxButton_1.LogBoxButton, { backgroundColor: backgroundForLevel(props.level), onPress: props.disabled ? undefined : props.onPress, style: headerStyles.button }, props.disabled ? null : (react_1.default.createElement(react_native_1.Image, { source: props.image, tintColor: LogBoxStyle.getTextColor(), style: headerStyles.buttonImage }))));
}
const headerStyles = react_native_1.StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
        marginRight: 6,
        marginLeft: 6,
        borderRadius: 3,
    },
    buttonImage: {
        height: 14,
        width: 8,
    },
});
const styles = react_native_1.StyleSheet.create({
    syntax: {
        backgroundColor: LogBoxStyle.getFatalColor(),
    },
    static: {
        backgroundColor: LogBoxStyle.getFatalColor(),
    },
    fatal: {
        backgroundColor: LogBoxStyle.getFatalColor(),
    },
    warn: {
        backgroundColor: LogBoxStyle.getWarningColor(),
    },
    error: {
        backgroundColor: LogBoxStyle.getErrorColor(),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: react_native_1.Platform.select({
            default: 48,
            ios: 44,
        }),
    },
    title: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    titleText: {
        color: LogBoxStyle.getTextColor(),
        fontSize: 16,
        fontWeight: '600',
        includeFontPadding: false,
        lineHeight: 20,
    },
    safeArea: {
        paddingTop: react_native_1.Platform.OS !== 'ios' ? react_native_1.StatusBar.currentHeight : 40,
    },
});
//# sourceMappingURL=LogBoxInspectorHeader.js.map