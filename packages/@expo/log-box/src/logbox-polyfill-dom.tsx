'use dom';

import { LogBoxInspectorContainer } from './ErrorOverlay';
import { LogBoxLog, LogContext, StackType } from './Data/LogBoxLog';
import * as LogBoxData from './Data/LogBoxData';

import React from 'react';
import type { CodeFrame } from './devServerEndpoints';
import { parseLogBoxException } from './Data/parseLogBoxLog';

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
  onCopyText,
  platform,
  fetchJsonAsync,
  reloadRuntime,
  ...props
}: {
  onCopyText: (text: string) => void;
  fetchJsonAsync: (input: RequestInfo, init?: RequestInit) => Promise<any>;
  reloadRuntime: () => void;
  platform?: string;
  onDismiss?: (index: number) => void;
  onMinimize?: () => void;
  onChangeSelectedIndex?: (index: number) => void;
  logs?: any[];
  nativeLogs?: any[];
  selectedIndex?: number;
  dom?: import('expo/dom/internal').DOMPropsInternal;
}) {
  const logs = React.useMemo(() => {
    // Convert from React Native style to Expo style LogBoxLog
    return [
      ...(props.logs?.map(
        ({ symbolicated, symbolicatedComponentStack, codeFrame, componentCodeFrame, ...log }) => {
          const outputCodeFrame: Partial<Record<StackType, CodeFrame>> = {};

          if (codeFrame) {
            outputCodeFrame.stack = codeFrame;
          }
          if (componentCodeFrame) {
            outputCodeFrame.component = componentCodeFrame;
          }

          const outputSymbolicated = {
            stack: {
              error: null,
              stack: null,
              status: 'NONE',
            },
            component: {
              error: null,
              stack: null,
              status: 'NONE',
            },
          };

          if (symbolicated) {
            outputSymbolicated.stack = symbolicated;
          }
          if (symbolicatedComponentStack) {
            outputSymbolicated.component = {
              error: symbolicatedComponentStack.error,
              // @ts-ignore
              stack: symbolicatedComponentStack.componentStack?.map((frame) => ({
                // From the upstream style (incorrect)
                // {
                //   "fileName": "/Users/evanbacon/Documents/GitHub/expo/node_modules/react-native/Libraries/Components/View/View.js",
                //   "location": { "row": 32, "column": 33 },
                //   "content": "React.forwardRef$argument_0",
                //   "collapse": false
                // },

                // To the stack frame style (correct)
                column: frame.location?.column,
                file: frame.fileName,
                lineNumber: frame.location?.row,
                methodName: frame.content,
                collapse: frame.collapse,
              })),
              status: symbolicatedComponentStack.status,
            };
          }

          return new LogBoxLog({
            ...log,

            codeFrame: outputCodeFrame,
            symbolicated: outputSymbolicated,
          });
        }
      ) ?? []),
      ...((props.nativeLogs?.map((message) => {
        const log = new LogBoxLog(parseLogBoxException({
          originalMessage: message,
          stack: [],
        }));
        log.componentStack = [];
        return log;
      }) ?? [])),
    ];
  }, []);
  const [selectedIndex, _setSelectedIndex] = React.useState(props.selectedIndex ?? (logs && logs?.length - 1) ?? -1);

  // @ts-ignore
  globalThis.__polyfill_onCopyText = onCopyText;
  // @ts-ignore
  globalThis.__polyfill_platform = platform;
  // @ts-ignore
  globalThis.__polyfill_dom_fetchJsonAsync = fetchJsonAsync;
  // @ts-ignore
  globalThis.__polyfill_dom_reloadRuntime = reloadRuntime;
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
