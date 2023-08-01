/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ansi } from '../UI/AnsiHighlight';
import { LogBoxButton } from '../UI/LogBoxButton';
import * as LogBoxStyle from '../UI/LogBoxStyle';
import { CODE_FONT } from '../UI/constants';
import { formatProjectFilePath } from '../formatProjectFilePath';
import openFileInEditor from '../modules/openFileInEditor';
import { LogBoxInspectorSection } from './LogBoxInspectorSection';
export function LogBoxInspectorCodeFrame({ codeFrame }) {
    if (codeFrame == null) {
        return null;
    }
    function getFileName() {
        return formatProjectFilePath(process.env.EXPO_PROJECT_ROOT, codeFrame?.fileName);
    }
    function getLocation() {
        const location = codeFrame?.location;
        if (location != null) {
            return ` (${location.row}:${location.column + 1 /* Code frame columns are zero indexed */})`;
        }
        return null;
    }
    return (React.createElement(LogBoxInspectorSection, { heading: "Source" },
        React.createElement(View, { style: styles.box },
            React.createElement(View, { style: styles.frame },
                React.createElement(ScrollView, { horizontal: true },
                    React.createElement(Ansi, { style: styles.content, text: codeFrame.content }))),
            React.createElement(LogBoxButton, { backgroundColor: {
                    default: 'transparent',
                    pressed: LogBoxStyle.getBackgroundDarkColor(1),
                }, style: styles.button, onPress: () => {
                    openFileInEditor(codeFrame.fileName, codeFrame.location?.row ?? 0);
                } },
                React.createElement(Text, { style: styles.fileText },
                    getFileName(),
                    getLocation())))));
}
const styles = StyleSheet.create({
    box: {
        backgroundColor: LogBoxStyle.getBackgroundColor(),
        borderWidth: 1,
        borderColor: '#323232',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        borderRadius: 3,
    },
    frame: {
        padding: 10,
        borderBottomColor: LogBoxStyle.getTextColor(0.1),
        borderBottomWidth: 1,
    },
    button: {
        paddingTop: 10,
        paddingBottom: 10,
    },
    content: {
        color: LogBoxStyle.getTextColor(1),
        fontSize: 12,
        includeFontPadding: false,
        lineHeight: 20,
        fontFamily: CODE_FONT,
    },
    fileText: {
        userSelect: 'none',
        color: LogBoxStyle.getTextColor(0.5),
        textAlign: 'center',
        flex: 1,
        fontSize: 16,
        includeFontPadding: false,
        fontFamily: CODE_FONT,
    },
});
//# sourceMappingURL=LogBoxInspectorCodeFrame.js.map