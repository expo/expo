/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import * as React from 'react';
import { NativeEventEmitter } from 'react-native';

import { LogBoxLog, LogContext } from './LogBoxLog';
import type { LogLevel, MetroStackFrame, StackType, Category, Message } from './Types';
import type { ExtendedExceptionData } from './parseLogBoxLog';
import { isError, parseLogBoxException, parseLogBoxLog } from './parseLogBoxLog';
import { parseErrorStack } from '../utils/parseErrorStack';

export type LogBoxLogs = Set<LogBoxLog>;

export type LogData = {
  level: LogLevel;
  message: Message;
  category: Category;
  componentStack: MetroStackFrame[];
};

export type Observer = (options: {
  logs: LogBoxLogs;
  isDisabled: boolean;
  selectedLogIndex: number;
}) => void;

export type IgnorePattern = string | RegExp;

export type Subscription = {
  unsubscribe: () => void;
};

export type WarningInfo = {
  finalFormat: string;
  forceDialogImmediately: boolean;
  suppressDialog_LEGACY: boolean;
  suppressCompletely: boolean;
  monitorEvent: string | null;
  monitorListVersion: number;
  monitorSampleRate: number;
};

export type WarningFilter = (format: string) => WarningInfo;

let warningFilter: WarningFilter = function (format) {
  return {
    finalFormat: format,
    forceDialogImmediately: false,
    suppressDialog_LEGACY: false,
    suppressCompletely: false,
    monitorEvent: 'warning_unhandled',
    monitorListVersion: 0,
    monitorSampleRate: 1,
  };
};

export function setWarningFilter(filter: WarningFilter): void {
  warningFilter = filter;
}

export function checkWarningFilter(format: string): WarningInfo {
  return warningFilter(format);
}

type Props = object;

type State = {
  logs: LogBoxLogs;
  isDisabled: boolean;
  hasError: boolean;
  selectedLogIndex: number;
};

const observers: Set<{ observer: Observer } & any> = new Set();
const ignorePatterns: Set<IgnorePattern> = new Set();
let logs: LogBoxLogs = new Set();
let updateTimeout: null | ReturnType<typeof setTimeout> = null;
let _isDisabled = false;
let _selectedIndex = -1;

const LOGBOX_ERROR_MESSAGE = 'An error was thrown while presenting an error!';

function getNextState() {
  return {
    logs,
    isDisabled: _isDisabled,
    selectedLogIndex: _selectedIndex,
  };
}

export function reportUnexpectedLogBoxError(error: any): void {
  if (isError(error)) {
    error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
  }
  addException(error);
}

export function isLogBoxErrorMessage(message: string): boolean {
  return typeof message === 'string' && message.includes(LOGBOX_ERROR_MESSAGE);
}

export function isMessageIgnored(message: string): boolean {
  for (const pattern of ignorePatterns) {
    if (
      (pattern instanceof RegExp && pattern.test(message)) ||
      (typeof pattern === 'string' && message.includes(pattern))
    ) {
      return true;
    }
  }
  return false;
}

function handleUpdate(): void {
  if (updateTimeout == null) {
    updateTimeout = setTimeout(() => {
      updateTimeout = null;
      const nextState = getNextState();
      observers.forEach(({ observer }) => observer(nextState));
    }, 0);
  }
}

/** Exposed for debugging */
export function _appendNewLog(newLog: LogBoxLog): void {
  // Don't want store these logs because they trigger a
  // state update when we add them to the store.
  if (isMessageIgnored(newLog.message.content)) {
    return;
  }

  // If the next log has the same category as the previous one
  // then roll it up into the last log in the list by incrementing
  // the count (similar to how Chrome does it).
  const lastLog = Array.from(logs).pop();

  if (lastLog && lastLog.category === newLog.category) {
    if (lastLog.level === newLog.level) {
      lastLog.incrementCount();
      handleUpdate();
      return;
    } else {
      // Determine which one is more important. This is because console.error for React errors shows before the more important root componentDidCatch which should force the UI to show.
      if (newLog.level === 'fatal') {
        // If the new log is fatal, then we want to show it
        // and hide the last one.
        newLog.count = lastLog.count;
        logs.delete(lastLog);
      }
    }
  }

  if (newLog.level === 'fatal') {
    // If possible, to avoid jank, we don't want to open the error before
    // it's symbolicated. To do that, we optimistically wait for
    // symbolication for up to a second before adding the log.
    const OPTIMISTIC_WAIT_TIME = 1000;

    let addPendingLog: null | (() => void) = () => {
      logs.add(newLog);
      if (_selectedIndex < 0) {
        setSelectedLog(logs.size - 1);
      } else {
        handleUpdate();
      }
      addPendingLog = null;
    };

    const optimisticTimeout = setTimeout(() => {
      if (addPendingLog) {
        addPendingLog();
      }
    }, OPTIMISTIC_WAIT_TIME);

    // TODO: HANDLE THIS
    newLog.symbolicate('component');

    newLog.symbolicate('stack', (status) => {
      if (addPendingLog && status !== 'PENDING') {
        addPendingLog();
        clearTimeout(optimisticTimeout);
      } else if (status !== 'PENDING') {
        // The log has already been added but we need to trigger a render.
        handleUpdate();
      }
    });
  } else if (newLog.level === 'syntax' || newLog.level === 'resolution') {
    logs.add(newLog);
    setSelectedLog(logs.size - 1);
  } else {
    logs.add(newLog);
    handleUpdate();
  }
}

export function addLog(log: LogData): void {
  const errorForStackTrace = new Error();

  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setTimeout(() => {
    try {
      const stack = parseErrorStack(errorForStackTrace?.stack);

      _appendNewLog(
        new LogBoxLog({
          level: log.level,
          message: log.message,
          isComponentError: !!log.componentStack?.length,
          stack,
          category: log.category,
          componentStack: log.componentStack,
          codeFrame: {},
        })
      );
    } catch (unexpectedError: any) {
      reportUnexpectedLogBoxError(unexpectedError);
    }
  }, 0);
}

export function addException(error: ExtendedExceptionData): void {
  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setTimeout(() => {
    try {
      _appendNewLog(new LogBoxLog(parseLogBoxException(error)));
    } catch (unexpectedError: any) {
      reportUnexpectedLogBoxError(unexpectedError);
    }
  }, 0);
}

export function symbolicateLogNow(type: StackType, log: LogBoxLog) {
  log.symbolicate(type, () => {
    handleUpdate();
  });
}

export function retrySymbolicateLogNow(type: StackType, log: LogBoxLog) {
  log.retrySymbolicate(type, () => {
    handleUpdate();
  });
}

export function symbolicateLogLazy(type: StackType, log: LogBoxLog) {
  log.symbolicate(type);
}

export function clear(): void {
  if (logs.size > 0) {
    logs = new Set();
    setSelectedLog(-1);
  }
}

export function setSelectedLog(proposedNewIndex: number): void {
  const oldIndex = _selectedIndex;
  let newIndex = proposedNewIndex;

  const logArray = Array.from(logs);
  let index = logArray.length - 1;
  while (index >= 0) {
    // The latest syntax error is selected and displayed before all other logs.
    if (logArray[index].level === 'syntax' || logArray[index].level === 'resolution') {
      newIndex = index;
      break;
    }
    index -= 1;
  }
  _selectedIndex = newIndex;
  handleUpdate();

  if (process.env.EXPO_OS === 'web') {
    setTimeout(() => {
      if (oldIndex < 0 && newIndex >= 0) {
        require('../ErrorOverlayWebControls').presentGlobalErrorOverlay();
      } else if (oldIndex >= 0 && newIndex < 0) {
        require('../ErrorOverlayWebControls').dismissGlobalErrorOverlay();
      }
    }, 0);
  }
}

export function clearErrors(): void {
  const newLogs = Array.from(logs).filter((log) => log.level !== 'error' && log.level !== 'fatal');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    setSelectedLog(-1);
  }
}

export function dismiss(log: LogBoxLog): void {
  if (logs.has(log)) {
    logs.delete(log);
    handleUpdate();
  } else {
    // Find log with matching message
    const message = log.message.content;
    const logToDismiss = Array.from(logs).find((l) => l.message.content === message);
    if (logToDismiss) {
      logs.delete(logToDismiss);
      handleUpdate();
    } else {
      console.warn('LogBoxLog not found in logs:', log, logs);
    }
  }
}

export function getIgnorePatterns(): IgnorePattern[] {
  return Array.from(ignorePatterns);
}

export function addIgnorePatterns(patterns: IgnorePattern[]): void {
  const existingSize = ignorePatterns.size;
  // The same pattern may be added multiple times, but adding a new pattern
  // can be expensive so let's find only the ones that are new.
  patterns.forEach((pattern: IgnorePattern) => {
    if (pattern instanceof RegExp) {
      for (const existingPattern of ignorePatterns) {
        if (
          existingPattern instanceof RegExp &&
          existingPattern.toString() === pattern.toString()
        ) {
          return;
        }
      }
      ignorePatterns.add(pattern);
    }
    ignorePatterns.add(pattern);
  });
  if (ignorePatterns.size === existingSize) {
    return;
  }
  // We need to recheck all of the existing logs.
  // This allows adding an ignore pattern anywhere in the codebase.
  // Without this, if you ignore a pattern after the a log is created,
  // then we would keep showing the log.
  logs = new Set(Array.from(logs).filter((log) => !isMessageIgnored(log.message.content)));
  handleUpdate();
}

export function setDisabled(value: boolean): void {
  if (value === _isDisabled) {
    return;
  }
  _isDisabled = value;
  handleUpdate();
}

export function isDisabled(): boolean {
  return _isDisabled;
}

export function observe(observer: Observer): Subscription {
  const subscription = { observer };
  observers.add(subscription);

  observer(getNextState());

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}

const emitter = new NativeEventEmitter({
  addListener() {},
  removeListeners() {},
});

export function withSubscription(WrappedComponent: React.FC<any>) {
  class RootDevErrorBoundary extends React.Component<React.PropsWithChildren<Props>, State> {
    static getDerivedStateFromError() {
      return { hasError: true };
    }

    constructor(props: object) {
      super(props);

      if (process.env.NODE_ENV === 'development') {
        emitter.addListener('devLoadingView:hide', () => {
          if (this.state.hasError) {
            this.retry();
          }
        });
      }
    }

    componentDidCatch(
      err: Error & { componentStack?: string },
      errorInfo: { componentStack: string } & any
    ) {
      // TODO: Won't this catch all React errors and make them appear as unexpected rendering errors?
      err.componentStack ??= errorInfo.componentStack;

      // TODO: Make the error appear more like the React console.error, appending the "The above error occurred" line.

      const { category, message, componentStack } = parseLogBoxLog([err]);

      if (!isMessageIgnored(message.content)) {
        addLog({
          // Always show the static rendering issues as full screen since they
          // are too confusing otherwise.
          level: 'fatal',
          category,
          message,
          componentStack,
        });
      }
    }

    _subscription?: Subscription;

    state = {
      logs: new Set<LogBoxLog>(),
      isDisabled: false,
      hasError: false,
      selectedLogIndex: -1,
    };

    retry = () => {
      return new Promise<void>((resolve) => {
        this.setState({ hasError: false }, () => {
          resolve();
        });
      });
    };

    render() {
      return (
        <LogContext.Provider
          value={{
            selectedLogIndex: this.state.selectedLogIndex,
            isDisabled: this.state.isDisabled,
            logs: Array.from(this.state.logs),
          }}>
          {this.props.children}
          <WrappedComponent />
        </LogContext.Provider>
      );
    }

    componentDidMount(): void {
      this._subscription = observe((data) => {
        // Ignore the initial empty log
        // if (data.selectedLogIndex === -1) return;
        React.startTransition(() => {
          this.setState(data);
        });
      });
    }

    componentWillUnmount(): void {
      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    }
  }

  return RootDevErrorBoundary;
}
