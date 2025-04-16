'use dom';

import { LogBoxInspector, LogBoxInspectorContainer } from './ErrorOverlay';
import { LogBoxLog, LogContext } from './Data/LogBoxLog';

// const Foo = LogBoxData.withSubscription(LogBoxInspectorContainer);

import React from 'react';

function useViewportMeta(content: string) {
  React.useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);

    return () => {
      // Optionally reset or remove on cleanup
      // meta.setAttribute('content', 'width=device-width, initial-scale=1');
    };
  }, [content]);
}

export default function LogBoxPolyfillDOM({
  onDismiss,
  onMinimize,
  onChangeSelectedIndex,

  selectedIndex,
  platform,
  fetchJsonAsync,
  ...props
}: {
  fetchJsonAsync: (input: RequestInfo, init?: RequestInit) => Promise<any>;
  platform: string;
  onDismiss: () => void;
  onMinimize: () => void;
  onChangeSelectedIndex: (index: number) => void;
  logs: any[];
  selectedIndex: number;
  dom?: import('expo/dom').DOMProps;
}) {
  const logs = React.useMemo(() => {
    return Array.from(props.logs.map((log) => new LogBoxLog(log)));
  }, []);

  globalThis.__polyfill_platform = platform;
  globalThis.__polyfill_dom_fetchJsonAsync = fetchJsonAsync;
  useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');

  return (
    <LogContext.Provider
      value={{
        selectedLogIndex: selectedIndex,
        isDisabled: false,
        logs,
      }}>
      <LogBoxInspectorContainer />
    </LogContext.Provider>
  );
}
