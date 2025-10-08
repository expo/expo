/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBoxInspectorSourceMapStatus = LogBoxInspectorSourceMapStatus;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_2 = require("react-native");
function getBackgroundColor(opacity) {
    return `rgba(51, 51, 51, ${opacity == null ? 1 : opacity})`;
}
function getTextColor(opacity) {
    return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}
function LogBoxButton(props) {
    const [pressed, setPressed] = (0, react_1.useState)(false);
    let backgroundColor = props.backgroundColor;
    if (!backgroundColor) {
        backgroundColor = {
            default: getBackgroundColor(0.95),
            pressed: getBackgroundColor(0.6),
        };
    }
    const content = (react_1.default.createElement(react_native_2.View, { style: [
            {
                backgroundColor: pressed ? backgroundColor.pressed : backgroundColor.default,
                ...react_native_2.Platform.select({
                    web: {
                        cursor: 'pointer',
                    },
                }),
            },
            props.style,
        ] }, props.children));
    return props.onPress == null ? (content) : (react_1.default.createElement(react_native_2.Pressable, { hitSlop: props.hitSlop, onPress: props.onPress, onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) }, content));
}
function LogBoxInspectorSourceMapStatus(props) {
    const [state, setState] = (0, react_1.useState)({
        animation: null,
        rotate: null,
    });
    (0, react_1.useEffect)(() => {
        if (props.status === 'PENDING') {
            if (state.animation == null) {
                const animated = new react_native_1.Animated.Value(0);
                const animation = react_native_1.Animated.loop(react_native_1.Animated.timing(animated, {
                    duration: 2000,
                    easing: react_native_1.Easing.linear,
                    toValue: 1,
                    useNativeDriver: true,
                }), {
                    iterations: -1,
                });
                setState({
                    animation,
                    rotate: animated.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
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
        case 'FAILED':
            image = require('@expo/log-box/assets/alert-triangle.png');
            color = `rgba(243, 83, 105, 1)`;
            break;
        case 'PENDING':
            image = require('@expo/log-box/assets/loader.png');
            color = `rgba(250, 186, 48, 1)`;
            break;
    }
    if (props.status === 'COMPLETE' || image == null) {
        return null;
    }
    return (react_1.default.createElement(LogBoxButton, { backgroundColor: {
            default: 'transparent',
            pressed: getBackgroundColor(1),
        }, hitSlop: { bottom: 8, left: 8, right: 8, top: 8 }, onPress: props.onPress, style: styles.root },
        react_1.default.createElement(react_native_1.Animated.Image, { source: image, tintColor: color ?? getTextColor(0.4), style: [
                styles.image,
                state.rotate == null || props.status !== 'PENDING'
                    ? null
                    : { transform: [{ rotate: state.rotate }] },
            ] }),
        react_1.default.createElement(react_native_1.Text, { style: [styles.text, { color }] }, "Source Map")));
}
const styles = react_native_1.StyleSheet.create({
    root: {
        alignItems: 'center',
        borderRadius: 12,
        flexDirection: 'row',
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
