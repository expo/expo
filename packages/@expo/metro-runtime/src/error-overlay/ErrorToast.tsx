/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useCallback, useMemo } from 'react';

import * as LogBoxData from './Data/LogBoxData';
import { LogBoxLog, useLogs } from './Data/LogBoxLog';
import { Pressable, Text, View } from 'react-native';
import { LogBoxMessage } from './LogBoxMessage';

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

    LogBoxData._appendNewLog(FIXTURES.component_error_thrown_in_render[0]);

    // Object.values(FIXTURES)
    //   .flat()
    //   .filter((log) => log.level !== 'syntax')
    //   .map((log) => {
    //     LogBoxData._appendNewLog(log);
    //   });
  }, []);

  if (!logs.length || isDisabled) {
    return null;
  }
  return <ErrorToastStack logs={logs} />;
}

function ErrorToastStack({ logs }: { logs: LogBoxLog[] }) {
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

      <Text
        numberOfLines={1}
        style={{
          userSelect: 'none',
          paddingLeft: 8,
          color: 'var(--expo-log-color-label)',
          flex: 1,
          fontSize: 14,
          lineHeight: 22,
        }}>
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
          color: 'var(--expo-log-color-label)',
          fontSize: 14,
          lineHeight: 18,
          textAlign: 'center',
          fontWeight: '600',
          textShadow: `0px 0px 3px rgba(51, 51, 51, 0.8)`,
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

function useStackTraceLimit(limit: number) {
  const current = React.useRef(0);
  React.useEffect(() => {
    try {
      // @ts-expect-error: StackTraceLimit is not defined in the Error type
      const currentLimit = Error.stackTraceLimit;
      // @ts-expect-error: StackTraceLimit is not defined in the Error type
      Error.stackTraceLimit = limit;
      current.current = currentLimit;
    } catch {}
    return () => {
      try {
        // @ts-expect-error: StackTraceLimit is not defined in the Error type
        Error.stackTraceLimit = current.current;
      } catch {}
    };
  }, [limit]);
}

function useRejectionHandler() {
  const hasError = React.useRef(false);

  useStackTraceLimit(35);

  React.useEffect(() => {
    function onUnhandledError(ev: ErrorEvent) {
      hasError.current = true;

      const error = ev?.error;
      if (!error || !(error instanceof Error) || typeof error.stack !== 'string') {
        return;
      }

      LogBoxData.addException(error);
    }

    function onUnhandledRejection(ev: PromiseRejectionEvent) {
      hasError.current = true;

      const reason = ev?.reason;
      if (!reason || !(reason instanceof Error) || typeof reason.stack !== 'string') {
        return;
      }

      LogBoxData.addException(reason);
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onUnhandledError);
    return () => {
      window.removeEventListener('error', onUnhandledError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return hasError;
}

export default LogBoxData.withSubscription(ErrorToastContainer);
