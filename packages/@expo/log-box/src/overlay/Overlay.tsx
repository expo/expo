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
import { useRuntimePlatform } from '../ContextPlatform';
import { SHOW_MORE_MESSAGE_LENGTH } from './Constants';
import { ErrorOverlayHeader } from './Header';
import ShowMoreButton from './ShowMoreButton';
import { StackTraceList } from './StackTraceList';
import * as LogBoxData from '../Data/LogBoxData';
import { LogBoxLog, useLogs } from '../Data/LogBoxLog';
import type { Message, LogLevel, StackType } from '../Data/Types';
import { classNames } from '../utils/classNames';
import { getFormattedStackTrace } from '../utils/devServerEndpoints';

import '../Global.css';
import { DevServerProvider, useDevServer } from '../ContextDevServer';

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
    <DevServerProvider>
      <LogBoxInspector log={log} selectedLogIndex={selectedLogIndex} logs={logs} />
    </DevServerProvider>
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
  const { platform, isNative } = useRuntimePlatform();
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
      if (isNative) {
        onMinimizeAction?.();
        cb?.();
      } else {
        animateClose(() => {
          onMinimizeAction?.();
          console.log('onMinimizeAction called', typeof cb);
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
        platform === 'ios' ? styles.overlayIos : null,
        platform === 'android' ? styles.overlayAndroid : null,
        platform === 'web' ? styles.overlayWeb : null,
      ]
        .filter(Boolean)
        .join(' ')}>
      <div
        data-expo-log-backdrop="true"
        className={platform === 'web' ? `${styles.bg} ${closing ? styles.bgExit : ''}` : undefined}
        onClick={() => {
          if (isDismissable) {
            onMinimize();
          }
        }}
      />
      <div
        className={classNames(
          styles.container,
          platform !== 'android' && styles.containerTopRadius,
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
    if (selectedLogIndex != null) {
      if (logs.length - 1 <= 0) {
        onMinimize(() => {
          LogBoxData.dismiss(logs[selectedLogIndex]);
        });
      } else if (selectedLogIndex >= logs.length - 1) {
        LogBoxData.setSelectedLog(selectedLogIndex - 1);
        LogBoxData.dismiss(logs[selectedLogIndex]);
      }
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

  // @ts-ignore
  const onReload = globalThis.__polyfill_dom_reloadRuntime;

  const onCopy = () => {
    // Copy log to clipboard
    const errContents = [log.message.content.trim()];

    const componentStack = log.getAvailableStack('component');
    if (componentStack?.length) {
      errContents.push(
        '',
        'Component Stack',
        getFormattedStackTrace(componentStack, serverRoot)
      );
    }
    const stackTrace = log.getAvailableStack('stack');

    if (stackTrace?.length) {
      errContents.push('', 'Call Stack', getFormattedStackTrace(stackTrace, serverRoot));
    }

    // @ts-ignore
    if (typeof __polyfill_onCopyText === 'function') {
      // @ts-ignore
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
    return () => {};
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
            {codeFrames.map(([key, codeFrame]) => (
              <ErrorCodeFrame key={key} showPathsRelativeTo={serverRoot} codeFrame={codeFrame} />
            ))}

            {log.isMissingModuleError && (
              <InstallMissingModuleTerminal
                moduleName={log.isMissingModuleError}
              />
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

function InstallMissingModuleTerminal({
  moduleName,
}: {
  moduleName: string;
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
