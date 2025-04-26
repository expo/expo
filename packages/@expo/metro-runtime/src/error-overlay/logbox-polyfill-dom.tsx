'use dom';

import { LogBoxInspectorContainer } from './ErrorOverlay';
import { LogBoxLog, LogContext, StackType } from './Data/LogBoxLog';
import * as LogBoxData from './Data/LogBoxData';

import React from 'react';
import type { CodeFrame } from './devServerEndpoints';

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
  onCopyText,
  selectedIndex,
  platform,
  fetchJsonAsync,
  ...props
}: {
  onCopyText: (text: string) => void;
  fetchJsonAsync: (input: RequestInfo, init?: RequestInit) => Promise<any>;
  platform: string;
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
      )
    );
  }, []);

  globalThis.__polyfill_onCopyText = onCopyText;
  globalThis.__polyfill_platform = platform;
  globalThis.__polyfill_dom_fetchJsonAsync = fetchJsonAsync;
  useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');
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
