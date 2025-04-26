/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useCallback, useEffect, useState } from 'react';

import * as LogBoxData from './Data/LogBoxData';
import { LogBoxLog, useLogs, type LogLevel, type StackType } from './Data/LogBoxLog';

import { ErrorCodeFrame, Terminal } from './overlay/ErrorCodeFrame';
import { ErrorOverlayHeader } from './overlay/ErrorOverlayHeader';
import { StackTraceList } from './overlay/StackTraceList';

import ReactDOM from 'react-dom/client';
import type { Message } from './Data/parseLogBoxLog';
import { fetchProjectMetadataAsync, getFormattedStackTrace } from './devServerEndpoints';
import styles from './ErrorOverlay.module.css';
import { LogBoxMessage } from './LogBoxMessage';
import { ShadowRoot } from './ShadowRoot';

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
    <ShadowRoot>
      <LogBoxInspector log={log} selectedLogIndex={selectedLogIndex} logs={logs} />
    </ShadowRoot>
  );
}

function useDevServerMeta() {
  const [meta, setMeta] = useState<{
    projectRoot: string;
    serverRoot: string;
    sdkVersion: string;
  } | null>(null);
  useEffect(() => {
    fetchProjectMetadataAsync()
      .then(setMeta)
      .catch((error) => {
        console.log(
          `Failed to fetch project metadata. Some debugging features may not work as expected: ${error}`
        );
      });
  }, []);

  return meta;
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
  const meta = useDevServerMeta();
  const isDismissable = !['static', 'syntax', 'resolution'].includes(log.level);
  const [closing, setClosing] = useState(false);

  const projectRoot = meta?.projectRoot;

  const animateClosed = (callback: () => void) => {
    setClosing(true);
    setTimeout(() => {
      callback();
    }, 200);
  };

  const onDismiss = (): void => {
    // Here we handle the cases when the log is dismissed and it
    // was either the last log, or when the current index
    // is now outside the bounds of the log array.
    const logsArray = Array.from(logs);
    if (selectedLogIndex != null) {
      if (logsArray.length - 1 <= 0) {
        animateClosed(() => {
          LogBoxData.setSelectedLog(-1);
        });
      } else if (selectedLogIndex >= logsArray.length - 1) {
        LogBoxData.setSelectedLog(selectedLogIndex - 1);
      }

      if (logs.length === 1) {
        animateClosed(() => {
          LogBoxData.dismiss(logsArray[selectedLogIndex]);
        });
      } else {
        LogBoxData.dismiss(logsArray[selectedLogIndex]);
      }
    }
  };

  const onMinimize = useCallback((): void => {
    animateClosed(() => {
      LogBoxData.setSelectedLog(-1);
    });
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

  const onCopy = () => {
    // Copy log to clipboard
    const errContents = [log.message.content.trim()];

    const componentStack = log.getAvailableStack('component');
    if (componentStack?.length) {
      errContents.push(
        '',
        'Component Stack',
        getFormattedStackTrace(projectRoot ?? '', componentStack)
      );
    }
    const stackTrace = log.getAvailableStack('stack');

    if (stackTrace?.length) {
      errContents.push('', 'Call Stack', getFormattedStackTrace(projectRoot ?? '', stackTrace));
    }

    if (typeof __polyfill_onCopyText === 'function') {
      __polyfill_onCopyText(errContents.join('\n'));
    } else {
      // Fallback to the default copy function
      navigator.clipboard.writeText(errContents.join('\n'));
    }
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
  }, [scrollRef, headerBlurRef]);

  let codeFrames = log?.codeFrame
    ? Object.entries(log.codeFrame).filter(([, value]) => value?.content)
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
    <>
      <div className={styles.overlay}>
        <div
          data-expo-log-backdrop="true"
          className={`${styles.bg} ${closing ? styles.bgExit : ''}`}
          onClick={() => {
            if (isDismissable) {
              onMinimize();
            }
          }}
        />
        <div className={`${styles.container} ${closing ? styles.containerExit : ''}`}>
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
              sdkVersion={meta?.sdkVersion}
              selectedIndex={selectedLogIndex}
              total={logs.length}
              isDismissable={isDismissable}
              onDismiss={onDismiss}
              onMinimize={onMinimize}
              onSelectIndex={onChangeSelectedIndex}
              level={log.level}
              onCopy={onCopy}
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

            {meta && (
              <div style={{ padding: '0 1rem', gap: 10, display: 'flex', flexDirection: 'column' }}>
                {codeFrames.map(([key, codeFrame]) => (
                  <ErrorCodeFrame key={key} projectRoot={projectRoot} codeFrame={codeFrame} />
                ))}

                {log.isMissingModuleError && (
                  <InstallMissingModule
                    moduleName={log.isMissingModuleError}
                    projectRoot={projectRoot ?? ''}
                  />
                )}

                {!!log?.componentStack?.length && (
                  <StackTraceList
                    type="component"
                    projectRoot={projectRoot ?? ''}
                    stack={log.getAvailableStack('component')}
                    symbolicationStatus={log.getStackStatus('component')}
                    // eslint-disable-next-line react/jsx-no-bind
                    onRetry={_handleRetry.bind(_handleRetry, 'component')}
                  />
                )}
                <StackTraceList
                  type="stack"
                  projectRoot={projectRoot ?? ''}
                  stack={log.getAvailableStack('stack')}
                  symbolicationStatus={log.getStackStatus('stack')}
                  // eslint-disable-next-line react/jsx-no-bind
                  onRetry={_handleRetry.bind(_handleRetry, 'stack')}
                />
              </div>
            )}

            {!isDismissable && (
              <ErrorOverlayFooter message="Build-time errors can only be dismissed by fixing the issue." />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InstallMissingModule({
  moduleName,
  projectRoot,
}: {
  moduleName: string;
  projectRoot: string;
}) {
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

const SHOW_MORE_MESSAGE_LENGTH = 300;

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

function ShowMoreButton({
  message,
  collapsed,
  onPress,
}: {
  collapsed: boolean;
  message: Message;
  onPress: () => void;
}) {
  if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
    return null;
  }
  return (
    <button
      style={{
        color: 'var(--expo-log-color-label)',
        fontFamily: 'var(--expo-log-font-family)',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        border: 'none',
        opacity: 0.7,
        fontSize: 14,
      }}
      onClick={onPress}>
      ... See more
    </button>
  );
}

let currentRoot: ReactDOM.Root | null = null;

export function presentGlobalErrorOverlay() {
  if (currentRoot) {
    return;
  }
  const ErrorOverlay = LogBoxData.withSubscription(LogBoxInspectorContainer);

  // TODO: Make this a shadow host
  // Create a new div with ID `error-overlay` element and render LogBoxInspector into it.
  const div = document.createElement('div');
  div.id = 'error-overlay';

  document.body.appendChild(div);

  currentRoot = ReactDOM.createRoot(div);
  currentRoot.render(React.createElement(ErrorOverlay));
}

export function dismissGlobalErrorOverlay() {
  // Remove div with ID `error-overlay`
  if (currentRoot) {
    currentRoot.unmount();
    currentRoot = null;
  }
  const div = document.getElementById('error-overlay');
  div?.remove();
}
