import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LogBoxMessage } from '../UI/LogBoxMessage';
import * as LogBoxStyle from '../UI/LogBoxStyle';
export function ErrorToastMessage({ message }) {
    return (React.createElement(Text, { numberOfLines: 1, style: styles.text }, message && React.createElement(LogBoxMessage, { plaintext: true, message: message, style: styles.substitutionText })));
}
const styles = StyleSheet.create({
    text: {
        userSelect: 'none',
        paddingLeft: 8,
        color: LogBoxStyle.getTextColor(1),
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
    substitutionText: {
        color: LogBoxStyle.getTextColor(0.6),
    },
});
//# sourceMappingURL=ErrorToastMessage.js.map