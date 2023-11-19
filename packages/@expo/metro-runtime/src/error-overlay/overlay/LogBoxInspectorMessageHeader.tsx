/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { LogLevel } from '../Data/LogBoxLog';
import type { Message } from '../Data/parseLogBoxLog';
import { LogBoxMessage } from '../UI/LogBoxMessage';
import * as LogBoxStyle from '../UI/LogBoxStyle';

type Props = {
  collapsed: boolean;
  message: Message;
  level: LogLevel;
  title: string;
  onPress: () => void;
};

const SHOW_MORE_MESSAGE_LENGTH = 300;

function ShowMoreButton({
  message,
  collapsed,
  onPress,
}: Pick<Props, 'collapsed' | 'message' | 'onPress'>) {
  if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
    return null;
  }
  return (
    <Text style={styles.collapse} onPress={onPress}>
      ... See More
    </Text>
  );
}

export function LogBoxInspectorMessageHeader(props: Props) {
  return (
    <View style={styles.body}>
      <View style={styles.heading}>
        <Text style={[styles.headingText, styles[props.level]]}>{props.title}</Text>
      </View>
      <Text style={styles.bodyText}>
        <LogBoxMessage
          maxLength={props.collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity}
          message={props.message}
          style={styles.messageText}
        />
        <ShowMoreButton {...props} />
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    ...Platform.select({
      web: {
        boxShadow: `0 2px 0 2px #00000080`,
      },
    }),
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
