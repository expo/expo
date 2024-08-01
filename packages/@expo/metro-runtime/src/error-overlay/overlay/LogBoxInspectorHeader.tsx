/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

import type { LogLevel } from '../Data/LogBoxLog';
import { useLogs } from '../Data/LogContext';
import { LogBoxButton } from '../UI/LogBoxButton';
import * as LogBoxStyle from '../UI/LogBoxStyle';

type Props = {
  onSelectIndex: (selectedIndex: number) => void;
  level: LogLevel;
};

export function LogBoxInspectorHeader(props: Props) {
  const { selectedLogIndex: selectedIndex, logs } = useLogs();
  const total = logs.length;

  if (props.level === 'syntax') {
    return (
      <View style={[styles.safeArea, styles[props.level]]}>
        <View style={styles.header}>
          <View style={styles.title}>
            <Text style={styles.titleText}>Failed to compile</Text>
          </View>
        </View>
      </View>
    );
  }

  const prevIndex = selectedIndex - 1 < 0 ? total - 1 : selectedIndex - 1;
  const nextIndex = selectedIndex + 1 > total - 1 ? 0 : selectedIndex + 1;

  const titleText = `Log ${selectedIndex + 1} of ${total}`;

  return (
    <View style={[styles.safeArea, styles[props.level]]}>
      <View style={styles.header}>
        <LogBoxInspectorHeaderButton
          disabled={total <= 1}
          level={props.level}
          image={require('@expo/metro-runtime/assets/chevron-left.png')}
          onPress={() => props.onSelectIndex(prevIndex)}
        />
        <View style={styles.title}>
          <Text style={styles.titleText}>{titleText}</Text>
        </View>
        <LogBoxInspectorHeaderButton
          disabled={total <= 1}
          level={props.level}
          image={require('@expo/metro-runtime/assets/chevron-right.png')}
          onPress={() => props.onSelectIndex(nextIndex)}
        />
      </View>
    </View>
  );
}

const backgroundForLevel = (level: LogLevel) =>
  ({
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
  })[level];

function LogBoxInspectorHeaderButton(props: {
  disabled: boolean;
  image: number;
  level: LogLevel;
  onPress?: () => void;
}) {
  return (
    <LogBoxButton
      backgroundColor={backgroundForLevel(props.level)}
      onPress={props.disabled ? undefined : props.onPress}
      style={headerStyles.button}>
      {props.disabled ? null : (
        <Image
          source={props.image}
          tintColor={LogBoxStyle.getTextColor()}
          style={headerStyles.buttonImage}
        />
      )}
    </LogBoxButton>
  );
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
    paddingTop: process.env.EXPO_OS !== 'ios' ? StatusBar.currentHeight : 40,
  },
});
