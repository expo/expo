// A webview without babel to test faster.
import React from 'react';
import { WebView } from 'react-native-webview';

import { _emitGlobalEvent } from './global-events';
import { getInjectEventScript, NATIVE_ACTION, NATIVE_ACTION_RESULT } from './injection';
import type { BridgeMessage } from './www-types';

function mergeRefs(...props) {
  return function forwardRef(node) {
    props.forEach((ref) => {
      if (ref == null) {
        return;
      }

      if (typeof ref === 'function') {
        ref(node);
      } else if (typeof ref === 'object') {
        ref.current = node;
      }
    });
  };
}

const RawWebView = React.forwardRef(({ webview, $$source, ...marshallProps }: any, ref) => {
  const webviewRef = React.useRef<WebView>(null);

  const setRef = React.useMemo(() => mergeRefs(webviewRef, {}, ref), [webviewRef, ref]);

  const emit = React.useCallback(
    (detail: BridgeMessage<any>) => {
      webviewRef.current?.injectJavaScript(getInjectEventScript(detail));
    },
    [webviewRef]
  );

  // serializable props, action names.

  const smartActions = Object.entries(marshallProps).reduce<{
    props: Record<string, any>;
    names: string[];
  }>(
    (acc, [key, value]) => {
      if (value instanceof Function) {
        acc.names.push(key);
      } else {
        // TODO: Recurse and assert that nested functions cannot be used.
        acc.props[key] = value;
      }
      return acc;
    },
    { names: [], props: {} }
  );

  // When the `marshallProps` change, emit them to the webview.
  React.useEffect(() => {
    emit({ type: '$$props', data: smartActions });
  }, [emit, smartActions]);

  // TODO: Inject a JSON object into the webview to represent the initial props.
  return (
    <WebView
      webviewDebuggingEnabled={__DEV__}
      originWhitelist={['*']}
      allowFileAccess
      allowFileAccessFromFileURLs
      allowsAirPlayForMediaPlayback
      allowsFullscreenVideo
      {...webview}
      injectedJavaScriptBeforeContentLoaded={[
        // On first mount, inject `$$EXPO_INITIAL_PROPS` with the initial props.
        `window.$$EXPO_INITIAL_PROPS = ${JSON.stringify(smartActions)};true;`,
        webview?.injectedJavaScriptBeforeContentLoaded,
        'true;',
      ]
        .filter(Boolean)
        .join('\n')}
      ref={setRef}
      source={$$source}
      style={[
        webview?.style
          ? { flex: 1, backgroundColor: 'transparent' }
          : { backgroundColor: 'transparent' },
        webview?.style,
      ]}
      onMessage={(event) => {
        const { type, data } = JSON.parse(event.nativeEvent.data);

        if (type === NATIVE_ACTION) {
          if (!marshallProps || !marshallProps[data.actionId]) {
            throw new Error(`Native action "${data.actionId}" is not defined.`);
          }
          if (!(marshallProps[data.actionId] instanceof Function)) {
            throw new Error(`Native action "${data.actionId}" is not a function.`);
          }

          const action = marshallProps[data.actionId];
          // const fnName = `${data.actionId}(${data.args})`;

          const emitError = (error) => {
            // console.log('[Native] error:', fnName, error);
            emit({
              type: NATIVE_ACTION_RESULT,
              data: {
                uid: data.uid,
                actionId: data.actionId,
                error: serializeError(error),
              },
            });
          };
          const emitResolve = (result?: any) => {
            // console.log('[Native] resolve:', fnName, result);
            // Send async results back to the webview proxy for return values.
            emit({
              type: NATIVE_ACTION_RESULT,
              data: {
                uid: data.uid,
                actionId: data.actionId,
                result,
              },
            });
          };
          try {
            // console.log(`[Native] Invoke: ${fnName}`);
            const value = action(...data.args);
            if (value instanceof Promise) {
              // console.log(`[Native] Async: ${fnName}`, value);
              return value
                .then((result) => {
                  emitResolve(result);
                })
                .catch((error) => {
                  emitError(error);
                });
            } else {
              // console.log(`[Native] Sync: ${fnName}`, value);

              // Send async results back to the webview proxy for return values.
              return emitResolve(value);
            }
          } catch (error) {
            return emitError(error);
          }
        } else {
          webview?.onMessage?.(event);
        }
        _emitGlobalEvent({ type, data });
      }}
    />
  );
});

function serializeError(error: any) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      // TODO: Other props...
    };
  }
  return error;
}

export function StyleNoSelect() {
  if (
    // @ts-expect-error: Added via react-native-webview
    typeof window.ReactNativeWebView === 'undefined'
  )
    return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
     body {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
      }
      body * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
      }
    
    `,
      }}
    />
  );
}

export default RawWebView;
