/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogBoxMessage } from '../UI/LogBoxMessage';
import * as LogBoxStyle from '../UI/LogBoxStyle';
const SHOW_MORE_MESSAGE_LENGTH = 300;
function ShowMoreButton({ message, collapsed, onPress, }) {
    if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
        return null;
    }
    return (React.createElement(Text, { style: styles.collapse, onPress: onPress }, "... See More"));
}
export function LogBoxInspectorMessageHeader(props) {
    return (React.createElement(View, { style: styles.body },
        React.createElement(View, { style: styles.heading },
            React.createElement(Text, { style: [styles.headingText, styles[props.level]] }, props.title)),
        React.createElement(Text, { style: styles.bodyText },
            React.createElement(LogBoxMessage, { maxLength: props.collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity, message: props.message, style: styles.messageText }),
            React.createElement(ShowMoreButton, { ...props }))));
}
const styles = StyleSheet.create({
    body: {
        backgroundColor: LogBoxStyle.getBackgroundColor(1),
        boxShadow: `0 2px 0 2px #00000080`,
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