/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';

import * as LogBoxData from '../Data/LogBoxData';
import { LogBoxLog } from '../Data/LogBoxLog';
import { LogBoxMessage } from '../UI/LogBoxMessage';
import * as LogBoxStyle from '../UI/LogBoxStyle';

type Props = {
  log: LogBoxLog;
  totalLogCount: number;
  level: 'warn' | 'error';
  onPressOpen: () => void;
  onPressDismiss: () => void;
};

function useSymbolicatedLog(log: LogBoxLog) {
  // Eagerly symbolicate so the stack is available when pressing to inspect.
  useEffect(() => {
    LogBoxData.symbolicateLogLazy('stack', log);
    LogBoxData.symbolicateLogLazy('component', log);
  }, [log]);
}

export function ErrorToast(props: Props) {
  const { totalLogCount, log } = props;

  useSymbolicatedLog(log);

  return (
    <button data-expo-log-toast onClick={props.onPressOpen}>
      <Count count={totalLogCount} />

      <Text numberOfLines={1} style={styles.text}>
        {log.message && (
          <LogBoxMessage plaintext message={log.message} style={styles.substitutionText} />
        )}
      </Text>

      <Dismiss onPress={props.onPressDismiss} />
    </button>
  );
}

function Count({ count }: { count: number }) {
  return (
    <div
      style={{
        minWidth: 30,
        height: 30,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        background: 'var(--expo-log-color-danger)',
      }}>
      <Text
        style={{
          color: LogBoxStyle.getTextColor(1),
          fontSize: 14,
          lineHeight: 18,
          textAlign: 'center',
          fontWeight: '600',
          textShadow: `0px 0px 3px ${LogBoxStyle.getBackgroundColor(0.8)}`,
        }}>
        {count <= 1 ? '!' : count}
      </Text>
    </div>
  );
}

function Dismiss({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={{
        marginLeft: 5,
      }}
      hitSlop={{
        top: 12,
        right: 10,
        bottom: 12,
        left: 10,
      }}
      onPress={onPress}>
      {({
        /** @ts-expect-error: react-native types are broken. */
        hovered,
        pressed,
      }) => (
        <View
          style={[
            {
              backgroundColor: 'rgba(255,255,255,0.1)',
              height: 20,
              width: 20,
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
            },
            hovered && { opacity: 0.8 },
            pressed && { opacity: 0.5 },
          ]}>
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{
              width: 12,
              height: 12,
              color: 'white',
              // color: 'var(--expo-log-color-danger)',
            }}>
            <path
              id="Icon"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 7L7 17M7 7L17 17"
            />
          </svg>
        </View>
      )}
    </Pressable>
  );
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
