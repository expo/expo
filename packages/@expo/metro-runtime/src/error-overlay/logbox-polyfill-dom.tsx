'use dom';

import { LogBoxInspectorContainer } from './ErrorOverlay';
import { LogBoxLog, LogContext } from './Data/LogBoxLog';
import * as LogBoxData from './Data/LogBoxData';

// const Foo = LogBoxData.withSubscription(LogBoxInspectorContainer);

import React from 'react';

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
  platform: string | undefined;
  onDismiss: (index: number) => void;
  onMinimize: () => void;
  onChangeSelectedIndex: (index: number) => void;
  logs: any[];
  selectedIndex: number;
  dom?: import('expo/dom').DOMProps;
}) {
  const logs = React.useMemo(() => {
    // Convert from React Native style to Expo style LogBoxLog
    return Array.from(
      props.logs.map(
        ({
          symbolicated,
          symbolicatedComponentStack,

          codeFrame,
          componentCodeFrame,

          ...log
        }) => {
          // symbolicated: log.symbolicated,
          // symbolicatedComponentStack: log.symbolicatedComponentStack,
          // componentCodeFrame: log.componentCodeFrame,
          // level: log.level,
          // type: log.type,
          // message: log.message,
          // stack: log.stack,
          // category: log.category,
          // componentStack: log.componentStack,
          // componentStackType: log.componentStackType,
          // codeFrame: log.codeFrame,
          // isComponentError: log.isComponentError,
          // extraData: log.extraData,
          // count: log.count,

          const outputCodeFrame = {};

          if (codeFrame) {
            // @ts-ignore
            outputCodeFrame.stack = codeFrame.stack;
          }
          if (componentCodeFrame) {
            // @ts-ignore
            outputCodeFrame.component = componentCodeFrame.stack;
          }

          const outputSymbolicated = {};

          if (symbolicated) {
            // @ts-ignore
            outputSymbolicated.stack = symbolicated.stack;
          }
          if (symbolicatedComponentStack) {
            // @ts-ignore
            outputSymbolicated.component = symbolicatedComponentStack.stack;
          }

          return new LogBoxLog({
            ...log,

            codeFrame: outputCodeFrame,
            symbolicated: outputSymbolicated,
          });
        }
      )
    );
  }, []);

  // @ts-ignore
  globalThis.__polyfill_platform = platform;
  // @ts-ignore
  globalThis.__polyfill_dom_fetchJsonAsync = fetchJsonAsync;
  useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');
  // @ts-ignore
  LogBoxData.setSelectedLog = onChangeSelectedIndex;
  // LogBoxData.dismiss = onDismiss;

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
