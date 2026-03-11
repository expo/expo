/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useCallback, useMemo } from 'react';

import styles from './ErrorToast.module.css';
import * as LogBoxData from '../Data/LogBoxData';
import { LogBoxLog, useLogs } from '../Data/LogBoxLog';
import { LogBoxMessage } from '../overlay/Message';
import { parseUnexpectedThrownValue } from '../utils/parseUnexpectedThrownValue';
import '../overlay/Overlay.module.css';

export function ErrorToastContainer() {
  useRejectionHandler();
  const { logs, isDisabled } = useLogs();

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
    <div className={styles.container}>
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

function ErrorToast(props: {
  log: LogBoxLog;
  totalLogCount: number;
  level: 'warn' | 'error';
  onPressOpen: () => void;
  onPressDismiss: () => void;
}) {
  const { totalLogCount, log } = props;

  useSymbolicatedLog(log);

  return (
    <div className={styles.toast} onClick={props.onPressOpen} role="button" tabIndex={0}>
      <Count count={totalLogCount} />

      <span className={styles.message}>
        {log.message && <LogBoxMessage maxLength={40} message={log.message} />}
      </span>

      <Dismiss onPress={props.onPressDismiss} />
    </div>
  );
}

function Count({ count }: { count: number }) {
  return (
    <div className={styles.count}>
      <span className={styles.countText}>{count <= 1 ? '!' : count}</span>
    </div>
  );
}

function Dismiss({ onPress }: { onPress: () => void }) {
  return (
    <button
      className={styles.dismissButton}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}>
      <div className={styles.dismissContent}>
        <svg className={styles.dismissIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 7L7 17M7 7L17 17"
          />
        </svg>
      </div>
    </button>
  );
}

function useStackTraceLimit(limit: number) {
  const current = React.useRef(0);
  React.useEffect(() => {
    try {
      // @ts-ignore: StackTraceLimit is not defined in the Error type
      const currentLimit = Error.stackTraceLimit;
      // @ts-ignore: StackTraceLimit is not defined in the Error type
      Error.stackTraceLimit = limit;
      current.current = currentLimit;
    } catch {}
    return () => {
      try {
        // @ts-ignore: StackTraceLimit is not defined in the Error type
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

      const error: (Error & { componentStack?: string | null }) | undefined | object = ev?.error;
      if (!error || !(error instanceof Error) || typeof error.stack !== 'string') {
        // TODO: Handle non-Error objects?
        return;
      }

      error.componentStack = React.captureOwnerStack();
      LogBoxData.addException(parseUnexpectedThrownValue(error));
    }

    function onUnhandledRejection(ev: PromiseRejectionEvent) {
      hasError.current = true;

      const reason = ev?.reason;
      if (!reason || !(reason instanceof Error) || typeof reason.stack !== 'string') {
        // TODO: Handle non-Error objects?
        return;
      }

      LogBoxData.addException(parseUnexpectedThrownValue(reason));
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
