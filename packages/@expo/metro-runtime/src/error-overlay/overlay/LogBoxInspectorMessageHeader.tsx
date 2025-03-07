/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { Text } from 'react-native';

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

export function LogBoxInspectorMessageHeader(props: Props) {
  return (
    <div
      style={{
        padding: '0 1rem',
        display: 'flex',
        gap: 8,
        flexDirection: 'column',
      }}>
      <div style={{ display: 'flex' }}>
        <span
          data-testid="logbox_title"
          style={{
            fontFamily: 'var(--expo-log-font-family)',
            padding: 8,
            backgroundColor:
              props.level === 'warn' ? 'rgba(243, 250, 154, 0.2)' : 'rgba(205, 97, 94, 0.2)',
            borderRadius: 8,
            fontWeight: '600',
            fontSize: 14,
            color:
              props.level === 'warn' ? 'rgba(243, 250, 154, 1)' : `var(--expo-log-color-danger)`,
          }}>
          {props.title}
        </span>
      </div>
      <Text
        style={{
          color: LogBoxStyle.getTextColor(1),
          fontSize: 16,
          fontWeight: '500',
        }}>
        <LogBoxMessage
          maxLength={props.collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity}
          message={props.message}
          style={{
            color:
              props.level === 'warn' ? 'rgba(243, 250, 154, 1)' : `var(--expo-log-color-danger)`,
          }}
        />
        <ShowMoreButton {...props} />
      </Text>
    </div>
  );
}

function ShowMoreButton({
  message,
  collapsed,
  onPress,
}: Pick<Props, 'collapsed' | 'message' | 'onPress'>) {
  if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
    return null;
  }
  return (
    <Text
      style={{
        color: LogBoxStyle.getTextColor(0.7),
        fontSize: 14,
        fontWeight: '300',
        lineHeight: 12,
      }}
      onPress={onPress}>
      ... See More
    </Text>
  );
}
