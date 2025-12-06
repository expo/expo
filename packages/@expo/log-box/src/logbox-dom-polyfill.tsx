'use dom';

import React from 'react';

import { ActionsContext } from './ContextActions';
import * as LogBoxData from './Data/LogBoxData';
import { LogBoxLog, LogContext } from './Data/LogBoxLog';
import { useEnvironmentVariablesPolyfill } from './environmentHelper';
import { FetchTextAsync, setFetchText } from './fetchHelper';
import { LogBoxInspectorContainer } from './overlay/Overlay';
import { convertNativeToExpoLogBoxLog, convertToExpoLogBoxLog } from './utils/convertLogBoxLog';

export default function LogBoxPolyfillDOM({
  // Default is mainly used in RedBox replacement,
  // where we won't to keep the native webview wrapper interface as minimal as possible.
  onCopyText = (text: string) => navigator.clipboard.writeText(text),
  onMinimize,
  fetchTextAsync,
  onReload,
  ...props
}: {
  // Environment props
  devServerUrl: string | undefined;

  // Common actions props
  fetchTextAsync: FetchTextAsync | undefined;

  // LogBox UI actions props
  onMinimize: (() => void) | undefined;
  onReload: (() => void) | undefined;
  onCopyText: ((text: string) => void) | undefined;

  // LogBoxData actions props
  onDismiss: ((index: number) => void) | undefined;
  onChangeSelectedIndex: ((index: number) => void) | undefined;

  // LogBox props
  /**
   * LobBoxLogs from the JS Runtime
   */
  logs?: any[];
  /**
   * Logs from the native runtime (both native and JS, both iOS and Android, e.g. redbox errors)
   */
  nativeLogs?: any[];
  selectedIndex?: number;

  // DOM props
  dom?: import('expo/dom/internal').DOMPropsInternal;
}) {
  useEnvironmentVariablesPolyfill(props);
  const logs = React.useMemo(() => {
    return [
      // Convert from React Native style to Expo style LogBoxLog
      ...(props.logs ?? []).map(convertToExpoLogBoxLog),
      // Convert native logs to Expo Log Box format
      ...(props.nativeLogs ?? []).map(convertNativeToExpoLogBoxLog),
    ];
  }, [props.logs, props.nativeLogs]);
  const selectedIndex = props.selectedIndex ?? (logs && logs?.length - 1) ?? -1;

  if (fetchTextAsync) setFetchText(fetchTextAsync);
  useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');
  useNativeLogBoxDataPolyfill({ logs }, props);

  return (
    <LogContext
      value={{
        selectedLogIndex: selectedIndex,
        isDisabled: false,
        logs,
      }}>
      <ActionsContext onMinimize={onMinimize} onReload={onReload} onCopyText={onCopyText}>
        <LogBoxInspectorContainer />
      </ActionsContext>
    </LogContext>
  );
}

function useNativeLogBoxDataPolyfill(
  {
    logs,
  }: {
    logs: LogBoxLog[];
  },
  polyfill: {
    onChangeSelectedIndex?: (index: number) => void;
    onDismiss?: (index: number) => void;
  }
) {
  // @ts-ignore
  // eslint-disable-next-line import/namespace
  LogBoxData.setSelectedLog = polyfill.onChangeSelectedIndex;

  // @ts-ignore
  // eslint-disable-next-line import/namespace
  LogBoxData.dismiss = (log: LogBoxLog) => {
    const index = logs.indexOf(log);
    polyfill.onDismiss?.(index);
  };
}

function useViewportMeta(content: string) {
  React.useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');

    if (!meta) {
      meta = document.createElement('meta');
      // @ts-ignore
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  }, [content]);
}
