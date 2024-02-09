/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorToastMessage } from './ErrorToastMessage';
import * as LogBoxData from '../Data/LogBoxData';
import { LogBoxLog } from '../Data/LogBoxLog';
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
  const { totalLogCount, level, log } = props;

  useSymbolicatedLog(log);

  return (
    <View style={toastStyles.container}>
      <Pressable style={{ flex: 1 }} onPress={props.onPressOpen}>
        {({
          /** @ts-expect-error: react-native types are broken. */
          hovered,
          pressed,
        }) => (
          <View
            style={[
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
            ]}>
            <Count count={totalLogCount} level={level} />
            <ErrorToastMessage message={log.message} />
            <Dismiss onPress={props.onPressDismiss} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

function Count({ count, level }: { count: number; level: Props['level'] }) {
  return (
    <View style={[countStyles.inside, countStyles[level]]}>
      <Text style={countStyles.text}>{count <= 1 ? '!' : count}</Text>
    </View>
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
          style={[dismissStyles.press, hovered && { opacity: 0.8 }, pressed && { opacity: 0.5 }]}>
          <Image
            source={require('@expo/metro-runtime/assets/close.png')}
            style={dismissStyles.image}
          />
        </View>
      )}
    </Pressable>
  );
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
    ...Platform.select({
      web: {
        textShadow: `0px 0px 3px ${LogBoxStyle.getBackgroundColor(0.8)}`,
      },
    }),
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
