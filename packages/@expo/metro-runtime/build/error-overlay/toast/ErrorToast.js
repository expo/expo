/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LogBoxData from '../Data/LogBoxData';
import * as LogBoxStyle from '../UI/LogBoxStyle';
import { ErrorToastMessage } from './ErrorToastMessage';
function useSymbolicatedLog(log) {
    // Eagerly symbolicate so the stack is available when pressing to inspect.
    useEffect(() => {
        LogBoxData.symbolicateLogLazy('stack', log);
        LogBoxData.symbolicateLogLazy('component', log);
    }, [log]);
}
export function ErrorToast(props) {
    const { totalLogCount, level, log } = props;
    useSymbolicatedLog(log);
    return (React.createElement(View, { style: toastStyles.container },
        React.createElement(Pressable, { style: { flex: 1 }, onPress: props.onPressOpen }, ({ 
        /** @ts-expect-error: react-native types are broken. */
        hovered, pressed, }) => (React.createElement(View, { style: [
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
            React.createElement(Count, { count: totalLogCount, level: level }),
            React.createElement(ErrorToastMessage, { message: log.message }),
            React.createElement(Dismiss, { onPress: props.onPressDismiss }))))));
}
function Count({ count, level }) {
    return (React.createElement(View, { style: [countStyles.inside, countStyles[level]] },
        React.createElement(Text, { style: countStyles.text }, count <= 1 ? '!' : count)));
}
function Dismiss({ onPress }) {
    return (React.createElement(Pressable, { style: {
            marginLeft: 5,
        }, hitSlop: {
            top: 12,
            right: 10,
            bottom: 12,
            left: 10,
        }, onPress: onPress }, ({ 
    /** @ts-expect-error: react-native types are broken. */
    hovered, pressed, }) => (React.createElement(View, { style: [dismissStyles.press, hovered && { opacity: 0.8 }, pressed && { opacity: 0.5 }] },
        React.createElement(Image, { source: require('@expo/metro-runtime/assets/close.png'), style: dismissStyles.image })))));
}
const countStyles = StyleSheet.create({
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
        textShadow: `0px 0px 3px ${LogBoxStyle.getBackgroundColor(0.8)}`,
    },
});
const dismissStyles = StyleSheet.create({
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
const toastStyles = StyleSheet.create({
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