/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';

import { LogBoxLog, StackType } from './LogBoxLog';
import type { LogLevel } from './LogBoxLog';
import { LogContext } from './LogContext';
import { parseLogBoxException } from './parseLogBoxLog';
import type { Message, Category, ComponentStack, ExtendedExceptionData } from './parseLogBoxLog';
import NativeLogBox from '../modules/NativeLogBox';
import parseErrorStack from '../modules/parseErrorStack';

export type LogBoxLogs = Set<LogBoxLog>;

export type LogData = {
  level: LogLevel;
  message: Message;
  category: Category;
  componentStack: ComponentStack;
};

type ExtendedError = any;

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
let updateTimeout: null | ReturnType<typeof setImmediate> | ReturnType<typeof setTimeout> = null;
let _isDisabled = false;
let _selectedIndex = -1;

const LOGBOX_ERROR_MESSAGE =
  'An error was thrown when attempting to render log messages via LogBox.';

function getNextState() {
  return {
    logs,
    isDisabled: _isDisabled,
    selectedLogIndex: _selectedIndex,
  };
}

export function reportLogBoxError(error: ExtendedError, componentStack?: string): void {
  const ExceptionsManager = require('../modules/ExceptionsManager').default;

  if (componentStack != null) {
    error.componentStack = componentStack;
  }
  ExceptionsManager.handleException(error);
}

export function reportUnexpectedLogBoxError(error: ExtendedError, componentStack?: string): void {
  error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
  return reportLogBoxError(error, componentStack);
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

function setImmediateShim(callback: () => void) {
  if (!global.setImmediate) {
    return setTimeout(callback, 0);
  }
  return global.setImmediate(callback);
}

function handleUpdate(): void {
  if (updateTimeout == null) {
    updateTimeout = setImmediateShim(() => {
      updateTimeout = null;
      const nextState = getNextState();
      observers.forEach(({ observer }) => observer(nextState));
    });
  }
}

function appendNewLog(newLog: LogBoxLog): void {
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
    lastLog.incrementCount();
    handleUpdate();
    return;
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
  } else if (newLog.level === 'syntax') {
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
  setImmediate(() => {
    try {
      const stack = parseErrorStack(errorForStackTrace?.stack);

      appendNewLog(
        new LogBoxLog({
          level: log.level,
          message: log.message,
          isComponentError: false,
          stack,
          category: log.category,
          componentStack: log.componentStack,
        })
      );
    } catch (error) {
      reportUnexpectedLogBoxError(error);
    }
  });
}

export function addException(error: ExtendedExceptionData): void {
  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    try {
      appendNewLog(new LogBoxLog(parseLogBoxException(error)));
    } catch (loggingError) {
      reportUnexpectedLogBoxError(loggingError);
    }
  });
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
    if (logArray[index].level === 'syntax') {
      newIndex = index;
      break;
    }
    index -= 1;
  }
  _selectedIndex = newIndex;
  handleUpdate();
  if (NativeLogBox) {
    setTimeout(() => {
      if (oldIndex < 0 && newIndex >= 0) {
        NativeLogBox.show();
      } else if (oldIndex >= 0 && newIndex < 0) {
        NativeLogBox.hide();
      }
    }, 0);
  }
}

export function clearWarnings(): void {
  const newLogs = Array.from(logs).filter((log) => log.level !== 'warn');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    setSelectedLog(-1);
    handleUpdate();
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

export function withSubscription(WrappedComponent: React.FC<object>): React.Component<object> {
  class LogBoxStateSubscription extends React.Component<React.PropsWithChildren<Props>, State> {
    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(err: Error, errorInfo: { componentStack: string } & any) {
      /* $FlowFixMe[class-object-subtyping] added when improving typing for
       * this parameters */
      reportLogBoxError(err, errorInfo.componentStack);
    }

    _subscription?: Subscription;

    state = {
      logs: new Set<LogBoxLog>(),
      isDisabled: false,
      hasError: false,
      selectedLogIndex: -1,
    };

    render() {
      if (this.state.hasError) {
        // This happens when the component failed to render, in which case we delegate to the native redbox.
        // We can't show any fallback UI here, because the error may be with <View> or <Text>.
        return null;
      }

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
        this.setState(data);
      });
    }

    componentWillUnmount(): void {
      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    }

    _handleDismiss = (): void => {
      // Here we handle the cases when the log is dismissed and it
      // was either the last log, or when the current index
      // is now outside the bounds of the log array.
      const { selectedLogIndex, logs: stateLogs } = this.state;
      const logsArray = Array.from(stateLogs);
      if (selectedLogIndex != null) {
        if (logsArray.length - 1 <= 0) {
          setSelectedLog(-1);
        } else if (selectedLogIndex >= logsArray.length - 1) {
          setSelectedLog(selectedLogIndex - 1);
        }

        dismiss(logsArray[selectedLogIndex]);
      }
    };

    _handleMinimize = (): void => {
      setSelectedLog(-1);
    };

    _handleSetSelectedLog = (index: number): void => {
      setSelectedLog(index);
    };
  }

  // @ts-expect-error
  return LogBoxStateSubscription;
}
