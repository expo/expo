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
exports.LogBoxInspectorSourceMapStatus = void 0;
/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const LogBoxButton_1 = require("../UI/LogBoxButton");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
function LogBoxInspectorSourceMapStatus(props) {
    const [state, setState] = (0, react_1.useState)({
        animation: null,
        rotate: null,
    });
    (0, react_1.useEffect)(() => {
        if (props.status === "PENDING") {
            if (state.animation == null) {
                const animated = new react_native_1.Animated.Value(0);
                const animation = react_native_1.Animated.loop(react_native_1.Animated.timing(animated, {
                    duration: 2000,
                    easing: react_native_1.Easing.linear,
                    toValue: 1,
                    useNativeDriver: true,
                }));
                setState({
                    animation,
                    rotate: animated.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                    }),
                });
                animation.start();
            }
        }
        else {
            if (state.animation != null) {
                state.animation.stop();
                setState({
                    animation: null,
                    rotate: null,
                });
            }
        }
        return () => {
            if (state.animation != null) {
                state.animation.stop();
            }
        };
    }, [props.status, state.animation]);
    let image;
    let color;
    switch (props.status) {
        case "FAILED":
            image = require("@expo/metro-runtime/assets/alert-triangle.png");
            color = LogBoxStyle.getErrorColor(1);
            break;
        case "PENDING":
            image = require("@expo/metro-runtime/assets/loader.png");
            color = LogBoxStyle.getWarningColor(1);
            break;
    }
    if (props.status === "COMPLETE" || image == null) {
        return null;
    }
    return (react_1.default.createElement(LogBoxButton_1.LogBoxButton, { backgroundColor: {
            default: "transparent",
            pressed: LogBoxStyle.getBackgroundColor(1),
        }, hitSlop: { bottom: 8, left: 8, right: 8, top: 8 }, onPress: props.onPress, style: styles.root },
        react_1.default.createElement(react_native_1.Animated.Image, { source: image, tintColor: color !== null && color !== void 0 ? color : LogBoxStyle.getTextColor(0.4), style: [
                styles.image,
                state.rotate == null || props.status !== "PENDING"
                    ? null
                    : { transform: [{ rotate: state.rotate }] },
            ] }),
        react_1.default.createElement(react_native_1.Text, { style: [styles.text, { color }] }, "Source Map")));
}
exports.LogBoxInspectorSourceMapStatus = LogBoxInspectorSourceMapStatus;
const styles = react_native_1.StyleSheet.create({
    root: {
        alignItems: "center",
        borderRadius: 12,
        flexDirection: "row",
        height: 24,
        paddingHorizontal: 8,
    },
    image: {
        height: 14,
        width: 16,
        marginEnd: 4,
    },
    text: {
        fontSize: 12,
        includeFontPadding: false,
        lineHeight: 16,
    },
});
//# sourceMappingURL=LogBoxInspectorSourceMapStatus.js.map