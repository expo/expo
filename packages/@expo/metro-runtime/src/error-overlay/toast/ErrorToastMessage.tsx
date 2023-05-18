import { StyleSheet, Text } from '@bacons/react-views';
import React from 'react';

import type { Message as MessageType } from '../Data/parseLogBoxLog';
import { LogBoxMessage } from '../UI/LogBoxMessage';
import * as LogBoxStyle from '../UI/LogBoxStyle';

export function ErrorToastMessage({ message }: { message?: MessageType }) {
  return (
    <Text numberOfLines={1} selectable={false} style={styles.text}>
      {message && <LogBoxMessage plaintext message={message} style={styles.substitutionText} />}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
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
