/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useCallback, useMemo } from 'react';

import * as LogBoxData from './Data/LogBoxData';
import { LogBoxLog } from './Data/LogBoxLog';
import { useLogs } from './Data/LogContext';
import { useRejectionHandler } from './useRejectionHandler';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LogBoxMessage } from './LogBoxMessage';
import * as LogBoxStyle from './LogBoxStyle';

import './ErrorOverlay.css';

import * as FIXTURES from '@expo/metro-runtime/fixtures/log-box-error-fixtures';

export function ErrorToastContainer() {
  useRejectionHandler();
  const { logs, isDisabled } = useLogs();

  // HACK / DEBUG / TESTING / NOSHIP: This is here to develop the UI for the error overlay.
  // DO NOT SHIP TO PROD!
  React.useEffect(() => {
    // Open the UI for the last log
    LogBoxData.setSelectedLog(0);

    Object.values(FIXTURES)
      .flat()
      .filter((log) => log.level !== 'syntax')
      .map((log) => {
        LogBoxData._appendNewLog(log);
      });
  }, []);

  if (!logs.length || isDisabled) {
    return null;
  }
  return <ErrorToastStack logs={logs} />;
}

function ErrorToastStack({ logs }: { logs: LogBoxLog[] }) {
  const onDismissWarns = useCallback(() => {
    LogBoxData.clearWarnings();
  }, []);

  const onDismissErrors = useCallback(() => {
    LogBoxData.clearErrors();
  }, []);

  const setSelectedLog = useCallback((index: number): void => {
    LogBoxData.setSelectedLog(index);
  }, []);

  function openLog(log: LogBoxLog) {
    let index = logs.length - 1;
    while (index > 0 && logs[index] !== log) {
      index -= 1;
    }
    setSelectedLog(index);
  }

  const warnings = useMemo(() => logs.filter((log) => log.level === 'warn'), [logs]);

  const errors = useMemo(
    () => logs.filter((log) => log.level === 'error' || log.level === 'fatal'),
    [logs]
  );

  return (
    <div
      style={{
        bottom: 6,
        left: 10,
        right: 10,
        maxWidth: 320,
        position: 'fixed',
        display: 'flex',
      }}>
      {/* TODO: Remove warnings */}
      {warnings.length > 0 && (
        <ErrorToast
          log={warnings[warnings.length - 1]}
          level="warn"
          totalLogCount={warnings.length}
          onPressOpen={() => openLog(warnings[warnings.length - 1])}
          onPressDismiss={onDismissWarns}
        />
      )}
      {errors.length > 0 && (
        <ErrorToast
          log={errors[errors.length - 1]}
          level="error"
          totalLogCount={errors.length}
          onPressOpen={() => openLog(errors[errors.length - 1])}
          onPressDismiss={onDismissErrors}
        />
      )}
    </div>
  );
}

function useSymbolicatedLog(log: LogBoxLog) {
  // Eagerly symbolicate so the stack is available when pressing to inspect.
  useEffect(() => {
    LogBoxData.symbolicateLogLazy('stack', log);
    LogBoxData.symbolicateLogLazy('component', log);
  }, [log]);
}

export function ErrorToast(props: {
  log: LogBoxLog;
  totalLogCount: number;
  level: 'warn' | 'error';
  onPressOpen: () => void;
  onPressDismiss: () => void;
}) {
  const { totalLogCount, log } = props;

  useSymbolicatedLog(log);

  return (
    <button data-expo-log-toast onClick={props.onPressOpen}>
      <Count count={totalLogCount} />

      <Text numberOfLines={1} style={styles.text}>
        {log.message && <LogBoxMessage maxLength={40} message={log.message} />}
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

export default LogBoxData.withSubscription(ErrorToastContainer);
