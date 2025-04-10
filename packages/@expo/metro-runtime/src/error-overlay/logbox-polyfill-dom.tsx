'use dom';

import { LogBoxInspector, LogBoxInspectorContainer } from './ErrorOverlay';
import { LogBoxLog } from './Data/LogBoxLog';
import { LogContext } from './Data/LogContext';

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
  logs,
  selectedIndex,
}: {
  onDismiss: () => void;
  onMinimize: () => void;
  onChangeSelectedIndex: (index: number) => void;
  logs: any[];
  selectedIndex: number;
  dom?: import('expo/dom').DOMProps;
}) {
  useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');

  return (
    <LogContext.Provider
      value={{
        selectedLogIndex: selectedIndex,
        isDisabled: false,
        logs: Array.from(logs.map((log) => new LogBoxLog(log))),
      }}>
      <LogBoxInspectorContainer />
    </LogContext.Provider>
  );
}
