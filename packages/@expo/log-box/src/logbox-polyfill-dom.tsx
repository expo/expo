'use dom';

import { LogBoxInspectorContainer } from './ErrorOverlay';
import { LogBoxLog, LogContext, StackType } from './Data/LogBoxLog';
import * as LogBoxData from './Data/LogBoxData';

import React from 'react';
import type { CodeFrame } from './devServerEndpoints';
import { parseLogBoxException } from './Data/parseLogBoxLog';
import { RuntimePlatformProvider } from './ContextPlatform';
import { ActionsProvider } from './ContextActions';

export default function LogBoxPolyfillDOM({
  onMinimize,
  onCopyText,
  platform,
  fetchJsonAsync,
  reloadRuntime,
  devServerUrl,
  ...props
}: {
  onCopyText?: (text: string) => void;
  fetchJsonAsync?: (input: string, init?: {
    method?: string;
    body?: string;
  }) => Promise<any>;
  reloadRuntime?: () => void;
  platform?: string;
  devServerUrl?: string;
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
      // Convert native logs to Expo Log Box format
      ...((props.nativeLogs?.map((message) => {
        let originalMessage = message;
        if (platform === 'android') {
          try {
              const bodyIndex = originalMessage.indexOf("Body:");
              if (bodyIndex !== -1) {
                const originalJson = originalMessage.slice(bodyIndex + 5);
                if (originalJson) {
                  const originalErrorResponseBody = JSON.parse(originalJson);
                  originalMessage = originalErrorResponseBody.message;
                }
              }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        const log = new LogBoxLog(parseLogBoxException({
          originalMessage,
          stack: [],
        }));
        // Never show stack for native errors, these are typically bundling errors, component stack would lead to LogBox.
        log.componentStack = [];
        return log;
      }) ?? [])),
    ];
  }, [props.logs, props.nativeLogs, platform]);
  const selectedIndex = props.selectedIndex ?? (logs && logs?.length - 1) ?? -1;

  if (devServerUrl) {
    globalThis.process = globalThis.process || {};
    globalThis.process.env = {
      ...globalThis.process.env,
      EXPO_DEV_SERVER_ORIGIN: devServerUrl,
    };
  }

  // @ts-ignore
  globalThis.__polyfill_onCopyText = onCopyText;
  // @ts-ignore
  globalThis.__polyfill_platform = platform;
  
  if (fetchJsonAsync) {
    // @ts-ignore
    globalThis.__polyfill_dom_fetchJsonAsync = async (url: string, options?: {
      method?: string;
      body?: string;
    }) => {
      const response = await fetchJsonAsync(url, options);
      return JSON.parse(response);
    };
    // @ts-ignore
    globalThis.__polyfill_dom_fetchAsync = async (url: string, options?: {
      method?: string;
      body?: string;
    }) => {
      return await fetchJsonAsync(url, options);
    };
  }
  // @ts-ignore
  globalThis.__polyfill_dom_reloadRuntime = reloadRuntime;
  useViewportMeta('width=device-width, initial-scale=1, viewport-fit=cover');

  useNativeLogBoxDataPolyfill({logs}, props);

  return (
    <LogContext.Provider
      value={{
        selectedLogIndex: selectedIndex,
        isDisabled: false,
        logs,
      }}>
      <RuntimePlatformProvider platform={platform}>
        <ActionsProvider onMinimize={onMinimize} >
          <LogBoxInspectorContainer />
        </ActionsProvider>
      </RuntimePlatformProvider>
    </LogContext.Provider>
  );
}

function useNativeLogBoxDataPolyfill({
  logs,
}: {
  logs: LogBoxLog[];
}, polyfill: {
  onChangeSelectedIndex?: (index: number) => void;
  onDismiss?: (index: number) => void;
}) {
  // @ts-ignore
  LogBoxData.setSelectedLog = polyfill.onChangeSelectedIndex;

  // @ts-ignore
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

    return () => {
      // Optionally reset or remove on cleanup
      // meta.setAttribute('content', 'width=device-width, initial-scale=1');
    };
  }, [content]);
}
