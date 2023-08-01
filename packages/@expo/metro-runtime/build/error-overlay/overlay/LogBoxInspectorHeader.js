/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useLogs } from '../Data/LogContext';
import { LogBoxButton } from '../UI/LogBoxButton';
import * as LogBoxStyle from '../UI/LogBoxStyle';
export function LogBoxInspectorHeader(props) {
    const { selectedLogIndex: selectedIndex, logs } = useLogs();
    const total = logs.length;
    if (props.level === 'syntax') {
        return (React.createElement(View, { style: [styles.safeArea, styles[props.level]] },
            React.createElement(View, { style: styles.header },
                React.createElement(View, { style: styles.title },
                    React.createElement(Text, { style: styles.titleText }, "Failed to compile")))));
    }
    const prevIndex = selectedIndex - 1 < 0 ? total - 1 : selectedIndex - 1;
    const nextIndex = selectedIndex + 1 > total - 1 ? 0 : selectedIndex + 1;
    const titleText = `Log ${selectedIndex + 1} of ${total}`;
    return (React.createElement(View, { style: [styles.safeArea, styles[props.level]] },
        React.createElement(View, { style: styles.header },
            React.createElement(LogBoxInspectorHeaderButton, { disabled: total <= 1, level: props.level, image: require('@expo/metro-runtime/assets/chevron-left.png'), onPress: () => props.onSelectIndex(prevIndex) }),
            React.createElement(View, { style: styles.title },
                React.createElement(Text, { style: styles.titleText }, titleText)),
            React.createElement(LogBoxInspectorHeaderButton, { disabled: total <= 1, level: props.level, image: require('@expo/metro-runtime/assets/chevron-right.png'), onPress: () => props.onSelectIndex(nextIndex) }))));
}
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
}[level]);
function LogBoxInspectorHeaderButton(props) {
    return (React.createElement(LogBoxButton, { backgroundColor: backgroundForLevel(props.level), onPress: props.disabled ? undefined : props.onPress, style: headerStyles.button }, props.disabled ? null : (React.createElement(Image, { source: props.image, tintColor: LogBoxStyle.getTextColor(), style: headerStyles.buttonImage }))));
}
const headerStyles = StyleSheet.create({
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
const styles = StyleSheet.create({
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
        height: Platform.select({
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
        paddingTop: Platform.OS !== 'ios' ? StatusBar.currentHeight : 40,
    },
});
//# sourceMappingURL=LogBoxInspectorHeader.js.map