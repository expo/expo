/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import * as LogBoxData from './Data/LogBoxData';
import { LogBoxLog, StackType } from './Data/LogBoxLog';
import { useLogs, useSelectedLog } from './Data/LogContext';
import { ErrorOverlayHeader } from './overlay/ErrorOverlayHeader';
import { ErrorCodeFrame } from './overlay/ErrorCodeFrame';
import { LogBoxInspectorMessageHeader } from './overlay/LogBoxInspectorMessageHeader';
import { StackTraceList } from './overlay/StackTraceList';

const HEADER_TITLE_MAP = {
  warn: 'Console Warning',
  error: 'Console Error',
  fatal: 'Uncaught Error',
  syntax: 'Build Error',
  static: 'Server Error',
  component: 'Render Error',
};

export function LogBoxInspectorContainer() {
  const { selectedLogIndex, logs } = useLogs();
  console.log('selectedLogIndex', selectedLogIndex, logs);
  const log = logs[selectedLogIndex];
  if (log == null) {
    return null;
  }
  return <LogBoxInspector log={log} selectedLogIndex={selectedLogIndex} logs={logs} />;
}

export function LogBoxInspector({
  log,
  selectedLogIndex,
  logs,
}: {
  log: LogBoxLog;
  selectedLogIndex: number;
  logs: LogBoxLog[];
}) {
  const onDismiss = useCallback((): void => {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    const logsArray = Array.from(logs);
    if (selectedLogIndex != null) {
      if (logsArray.length - 1 <= 0) {
        LogBoxData.setSelectedLog(-1);
      } else if (selectedLogIndex >= logsArray.length - 1) {
        LogBoxData.setSelectedLog(selectedLogIndex - 1);
      }

      LogBoxData.dismiss(logsArray[selectedLogIndex]);
    }
  }, [selectedLogIndex]);

  const onMinimize = useCallback((): void => {
    LogBoxData.setSelectedLog(-1);
  }, []);

  const onChangeSelectedIndex = useCallback((index: number): void => {
    LogBoxData.setSelectedLog(index);
  }, []);

  useEffect(() => {
    if (log) {
      LogBoxData.symbolicateLogNow('stack', log);
      LogBoxData.symbolicateLogNow('component', log);
    }
  }, [log]);

  useEffect(() => {
    // Optimistically symbolicate the last and next logs.
    if (logs.length > 1) {
      const selected = selectedLogIndex;
      const lastIndex = logs.length - 1;
      const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
      const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
      for (const type of ['component', 'stack'] as const) {
        LogBoxData.symbolicateLogLazy(type, logs[prevIndex]);
        LogBoxData.symbolicateLogLazy(type, logs[nextIndex]);
      }
    }
  }, [logs, selectedLogIndex]);

  const _handleRetry = useCallback(
    (type: StackType) => {
      LogBoxData.retrySymbolicateLogNow(type, log);
    },
    [log]
  );

  const isDismissable = !['static', 'syntax'].includes(log.level);

  return (
    <>
      <div data-expo-log-overlay="true">
        <div
          data-expo-log-backdrop="true"
          onClick={() => {
            if (isDismissable) {
              onMinimize();
            }
          }}
        />
        <div data-expo-log-root="true">
          <ErrorOverlayHeader
            isDismissable={isDismissable}
            onDismiss={onDismiss}
            onMinimize={onMinimize}
            onSelectIndex={onChangeSelectedIndex}
            level={log.level}
          />
          <ErrorOverlayBody message={log.message} level={log.level} type={log.type}>
            <ErrorCodeFrame codeFrame={log.codeFrame} />

            <StackTraceList
              type="stack"
              stack={log.getAvailableStack('stack')}
              symbolicationStatus={log.symbolicated['stack'].status}
              // eslint-disable-next-line react/jsx-no-bind
              onRetry={_handleRetry.bind(_handleRetry, 'stack')}
            />
            {!!log?.componentStack?.length && (
              <StackTraceList
                type="component"
                stack={log.getAvailableStack('component')}
                symbolicationStatus={log.symbolicated['component'].status}
                // eslint-disable-next-line react/jsx-no-bind
                onRetry={_handleRetry.bind(_handleRetry, 'component')}
              />
            )}
          </ErrorOverlayBody>
          {!isDismissable && (
            <ErrorOverlayFooter message="Build-time errors can only be dismissed by fixing the issue." />
          )}
        </div>
      </div>
    </>
  );
}

function ErrorOverlayFooter({ message }: { message?: string }) {
  return (
    <div data-expo-log-footer>
      <footer
        style={{
          padding: '1rem',
          flex: 1,
          backgroundColor: 'var(--expo-log-secondary-system-background)',
          borderTop: `1px solid var(--expo-log-color-border)`,
        }}>
        <span
          style={{
            color: 'var(--expo-log-secondary-label)',
            fontSize: '0.875rem',
            fontFamily: 'var(--expo-log-font-family)',
          }}>
          {message}
        </span>
      </footer>
    </div>
  );
}

function ErrorOverlayBody({
  message,
  level,
  type,
  isComponentError,
  children,
}: {
  type: LogBoxLog['type'];
  message: LogBoxLog['message'];
  level: LogBoxLog['level'];
  isComponentError?: boolean;
  children?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const headerTitle = HEADER_TITLE_MAP[isComponentError ? 'component' : level] ?? type;

  const header = (
    <LogBoxInspectorMessageHeader
      collapsed={collapsed}
      onPress={() => setCollapsed(!collapsed)}
      message={message}
      level={level}
      title={headerTitle}
    />
  );

  return (
    <>
      {collapsed && header}
      <ScrollView contentContainerStyle={{ gap: 10, paddingHorizontal: '1rem' }}>
        {!collapsed && header}

        {children}
      </ScrollView>
    </>
  );
}

export default LogBoxData.withSubscription(LogBoxInspectorContainer);
