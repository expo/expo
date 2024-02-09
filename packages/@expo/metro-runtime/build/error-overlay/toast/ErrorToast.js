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
exports.ErrorToast = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ErrorToastMessage_1 = require("./ErrorToastMessage");
const LogBoxData = __importStar(require("../Data/LogBoxData"));
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
function useSymbolicatedLog(log) {
    // Eagerly symbolicate so the stack is available when pressing to inspect.
    (0, react_1.useEffect)(() => {
        LogBoxData.symbolicateLogLazy('stack', log);
        LogBoxData.symbolicateLogLazy('component', log);
    }, [log]);
}
function ErrorToast(props) {
    const { totalLogCount, level, log } = props;
    useSymbolicatedLog(log);
    return (react_1.default.createElement(react_native_1.View, { style: toastStyles.container },
        react_1.default.createElement(react_native_1.Pressable, { style: { flex: 1 }, onPress: props.onPressOpen }, ({ 
        /** @ts-expect-error: react-native types are broken. */
        hovered, pressed, }) => (react_1.default.createElement(react_native_1.View, { style: [
                toastStyles.press,
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
            react_1.default.createElement(Count, { count: totalLogCount, level: level }),
            react_1.default.createElement(ErrorToastMessage_1.ErrorToastMessage, { message: log.message }),
            react_1.default.createElement(Dismiss, { onPress: props.onPressDismiss }))))));
}
exports.ErrorToast = ErrorToast;
function Count({ count, level }) {
    return (react_1.default.createElement(react_native_1.View, { style: [countStyles.inside, countStyles[level]] },
        react_1.default.createElement(react_native_1.Text, { style: countStyles.text }, count <= 1 ? '!' : count)));
}
function Dismiss({ onPress }) {
    return (react_1.default.createElement(react_native_1.Pressable, { style: {
            marginLeft: 5,
        }, hitSlop: {
            top: 12,
            right: 10,
            bottom: 12,
            left: 10,
        }, onPress: onPress }, ({ 
    /** @ts-expect-error: react-native types are broken. */
    hovered, pressed, }) => (react_1.default.createElement(react_native_1.View, { style: [dismissStyles.press, hovered && { opacity: 0.8 }, pressed && { opacity: 0.5 }] },
        react_1.default.createElement(react_native_1.Image, { source: require('@expo/metro-runtime/assets/close.png'), style: dismissStyles.image })))));
}
const countStyles = react_native_1.StyleSheet.create({
    warn: {
        backgroundColor: LogBoxStyle.getWarningColor(1),
    },
    error: {
        backgroundColor: LogBoxStyle.getErrorColor(1),
    },
    log: {
        backgroundColor: LogBoxStyle.getLogColor(1),
    },
    inside: {
        marginRight: 8,
        minWidth: 22,
        aspectRatio: 1,
        paddingHorizontal: 4,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: LogBoxStyle.getTextColor(1),
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center',
        fontWeight: '600',
        ...react_native_1.Platform.select({
            web: {
                textShadow: `0px 0px 3px ${LogBoxStyle.getBackgroundColor(0.8)}`,
            },
        }),
    },
});
const dismissStyles = react_native_1.StyleSheet.create({
    press: {
        backgroundColor: '#323232',
        height: 20,
        width: 20,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        height: 8,
        width: 8,
    },
});
const toastStyles = react_native_1.StyleSheet.create({
    container: {
        height: 48,
        justifyContent: 'center',
        marginBottom: 4,
    },
    press: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#323232',
        backgroundColor: LogBoxStyle.getBackgroundColor(),
        flex: 1,
        paddingHorizontal: 12,
    },
});
//# sourceMappingURL=ErrorToast.js.map