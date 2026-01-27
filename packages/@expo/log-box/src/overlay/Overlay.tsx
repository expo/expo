/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useCallback, useEffect, useState } from 'react';

import { ErrorCodeFrame, Terminal } from './CodeFrame';
import { LogBoxMessage } from './Message';
import styles from './Overlay.module.css';
import { useActions } from '../ContextActions';
import { SHOW_MORE_MESSAGE_LENGTH } from './Constants';
import { ErrorOverlayHeader } from './Header';
import ShowMoreButton from './ShowMoreButton';
import { StackTraceList } from './StackTraceList';
import { DevServerContext, useDevServer } from '../ContextDevServer';
import * as LogBoxData from '../Data/LogBoxData';
import { LogBoxLog, useLogs } from '../Data/LogBoxLog';
import type { Message, LogLevel, StackType } from '../Data/Types';
import { classNames } from '../utils/classNames';
import { getFormattedStackTrace } from '../utils/devServerEndpoints';

const HEADER_TITLE_MAP: Record<LogLevel, string> = {
  error: 'Console Error',
  fatal: 'Uncaught Error',
  resolution: 'Resolution Error',
  syntax: 'Build Error',
  static: 'Server Error',
};

export function LogBoxInspectorContainer() {
  const { selectedLogIndex, logs } = useLogs();
  const log = logs[selectedLogIndex];
  if (log == null) {
    return null;
  }
  return (
    <DevServerContext>
      <LogBoxInspector log={log} selectedLogIndex={selectedLogIndex} logs={logs} />
    </DevServerContext>
  );
}

function LogBoxInspector({
  log,
  selectedLogIndex,
  logs,
}: {
  log: LogBoxLog;
  selectedLogIndex: number;
  logs: LogBoxLog[];
}) {
  const { onMinimize: onMinimizeAction } = useActions();
  const isDismissable = !['static', 'syntax', 'resolution'].includes(log.level);
  const [closing, setClosing] = useState(false);

  const animateClose = (callback: () => void) => {
    setClosing(true);
    setTimeout(() => {
      callback();
    }, 200);
  };

  const onMinimize = useCallback(
    (cb?: () => void): void => {
      if (['ios', 'android'].includes(process.env.EXPO_DOM_HOST_OS ?? '')) {
        onMinimizeAction?.();
        cb?.();
      } else {
        animateClose(() => {
          onMinimizeAction?.();
          cb?.();
        });
      }
    },
    [onMinimizeAction]
  );

  return (
    <div
      className={[
        styles.overlay,
        process.env.EXPO_DOM_HOST_OS === 'ios' ? styles.overlayIos : null,
        process.env.EXPO_DOM_HOST_OS === 'android' ? styles.overlayAndroid : null,
        process.env.EXPO_DOM_HOST_OS === undefined ? styles.overlayWeb : null,
      ]
        .filter(Boolean)
        .join(' ')}>
      <div
        data-expo-log-backdrop="true"
        className={
          process.env.EXPO_DOM_HOST_OS === undefined
            ? `${styles.bg} ${closing ? styles.bgExit : ''}`
            : undefined
        }
        onClick={() => {
          if (isDismissable) {
            onMinimize();
          }
        }}
      />
      <div
        className={classNames(
          styles.container,
          process.env.EXPO_DOM_HOST_OS !== 'android' && styles.containerTopRadius,
          closing && styles.containerExit
        )}>
        <LogBoxContent
          log={log}
          selectedLogIndex={selectedLogIndex}
          logs={logs}
          isDismissable={isDismissable}
          onMinimize={onMinimize}
        />
      </div>
    </div>
  );
}

function LogBoxContent({
  log,
  selectedLogIndex,
  logs,
  isDismissable,
  onMinimize,
}: {
  log: LogBoxLog;
  selectedLogIndex: number;
  logs: LogBoxLog[];
  isDismissable: boolean;
  onMinimize: (cb?: () => void) => void;
}) {
  const { serverRoot, sdkVersion } = useDevServer();

  const onDismiss = (): void => {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    if (selectedLogIndex === null) return;

    if (logs.length - 1 <= 0) {
      // Only one log, minimize the overlay and dismiss (remove) the log.
      onMinimize(() => {
        LogBoxData.dismiss(logs[0]);
      });
    } else if (selectedLogIndex <= logs.length - 1) {
      // Multiple logs, calculate the new selected, select it and dismiss (remove) the previously selected.
      const toDismissIndex = selectedLogIndex;
      // If we dismiss (remove) the first (toDismissIndex = 0) log, select the closes next log
      // (second one, which will become also the first log in the array)
      // so we stay at index 0, no setSelectedLog call needed.
      if (toDismissIndex !== 0) {
        LogBoxData.setSelectedLog(toDismissIndex - 1);
      }
      LogBoxData.dismiss(logs[toDismissIndex]);
    }
  };

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

  const { onReload, onCopyText } = useActions();

  const onCopy = () => {
    // Copy log to clipboard
    const errContents = [log.message.content.trim()];

    const componentStack = log.getAvailableStack('component');
    if (componentStack?.length) {
      errContents.push('', 'Component Stack', getFormattedStackTrace(componentStack, serverRoot));
    }
    const stackTrace = log.getAvailableStack('stack');

    if (stackTrace?.length) {
      errContents.push('', 'Call Stack', getFormattedStackTrace(stackTrace, serverRoot));
    }

    onCopyText?.(errContents.join('\n'));
  };
  const [collapsed, setCollapsed] = useState(true);

  const headerTitle = HEADER_TITLE_MAP[log.level] ?? log.type;

  const headerBlurRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Transition the opacity of the header blur when the scroll position changes.
  useEffect(() => {
    const scrollElement = scrollRef.current;
    const headerBlurElement = headerBlurRef.current;

    if (scrollElement && headerBlurElement) {
      const handleScroll = () => {
        const scrollTop = scrollElement.scrollTop;
        const opacity = Math.min(scrollTop / 16, 1);
        headerBlurElement.style.opacity = `${opacity}`;
      };

      scrollElement.addEventListener('scroll', handleScroll);
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
    return () => {};
  }, [scrollRef, headerBlurRef]);

  let codeFrames = log?.codeFrame
    ? (Object.entries(log.codeFrame).filter(([, value]) => value?.content) as [StackType, any][])
    : [];

  codeFrames = uniqueBy(
    uniqueBy(codeFrames, ([, value]) => {
      return [value.fileName, value.location?.column, value.location?.row].join(':');
    }),
    ([, value]) => {
      return value?.content;
    }
  );

  return (
    <div className={styles.content}>
      <div className={styles.headerBlur} ref={headerBlurRef} />
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          backgroundColor: 'var(--expo-log-color-background)',
        }}>
        <ErrorOverlayHeader
          sdkVersion={sdkVersion}
          selectedIndex={selectedLogIndex}
          total={logs.length}
          isDismissable={isDismissable}
          onDismiss={onDismiss}
          onMinimize={() => onMinimize()}
          onSelectIndex={onChangeSelectedIndex}
          level={log.level}
          onCopy={onCopy}
          onReload={onReload}
        />
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        <ErrorMessageHeader
          collapsed={collapsed}
          onPress={() => setCollapsed(!collapsed)}
          message={log.message}
          level={log.level}
          title={headerTitle}
        />

        {
          <div style={{ padding: '0 1rem', gap: 10, display: 'flex', flexDirection: 'column' }}>
            {codeFrames.map(([key, codeFrame]) => {
              // If no frame from a stack is expanded, likely no frame is from user code, let's not show the code snippet.
              // This avoid cluttering the overlay with irrelevant code frames of node_modules and internals.
              if (
                log.getStackStatus(key) === 'COMPLETE' &&
                log.getAvailableStack(key) &&
                // If there are no frames (for example in build errors) we want to show the code frame.
                log.getAvailableStack(key)!.length > 0 &&
                !log.getAvailableStack(key)!.some(({ collapse }) => !collapse)
              ) {
                return null;
              }
              return (
                <ErrorCodeFrame key={key} showPathsRelativeTo={serverRoot} codeFrame={codeFrame} />
              );
            })}

            {log.isMissingModuleError && (
              <InstallMissingModuleTerminal moduleName={log.isMissingModuleError} />
            )}

            {!!log?.componentStack?.length && (
              <StackTraceList
                key={selectedLogIndex + '-component-stack'}
                type="component"
                stack={log.getAvailableStack('component')}
                symbolicationStatus={log.getStackStatus('component')}
                // eslint-disable-next-line react/jsx-no-bind
                onRetry={_handleRetry.bind(_handleRetry, 'component')}
              />
            )}
            <StackTraceList
              key={selectedLogIndex + '-stack'}
              type="stack"
              stack={log.getAvailableStack('stack')}
              symbolicationStatus={log.getStackStatus('stack')}
              // eslint-disable-next-line react/jsx-no-bind
              onRetry={_handleRetry.bind(_handleRetry, 'stack')}
            />
          </div>
        }

        {!isDismissable && (
          <ErrorOverlayFooter message="Build-time errors can only be dismissed by fixing the issue." />
        )}
      </div>
    </div>
  );
}

function InstallMissingModuleTerminal({ moduleName }: { moduleName: string }) {
  return <Terminal moduleName={moduleName} content={`$ npx expo install ${moduleName}`} />;
}

function uniqueBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

function ErrorOverlayFooter({ message }: { message?: string }) {
  return (
    <div className={styles.footer}>
      <footer
        style={{
          padding: '1rem',
          flex: 1,
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

function ErrorMessageHeader(props: {
  collapsed: boolean;
  message: Message;
  level: LogLevel;
  title: string;
  onPress: () => void;
}) {
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
            marginLeft: -4,
            backgroundColor: 'rgba(205, 97, 94, 0.2)',
            borderRadius: 8,
            fontWeight: '600',
            fontSize: 14,
            color: `var(--expo-log-color-danger)`,
          }}>
          {props.title}
        </span>
      </div>
      <span
        style={{
          color: 'var(--expo-log-color-label)',
          fontFamily: 'var(--expo-log-font-family)',
          fontSize: 16,
          whiteSpace: 'pre-wrap',
          fontWeight: '500',
          wordBreak: 'normal',
        }}>
        <LogBoxMessage
          maxLength={props.collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity}
          message={props.message}
        />
        <ShowMoreButton {...props} />
      </span>
    </div>
  );
}
