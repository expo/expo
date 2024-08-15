// A webview without babel to test faster.
import React from 'react';
import { WebView } from 'react-native-webview';

import {
  getInjectEventScript,
  getInjectEnvsScript,
  NATIVE_ACTION,
  NATIVE_ACTION_RESULT,
} from './injection';
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

const RawWebView = React.forwardRef(({ dom, source, ...marshalProps }: any, ref) => {
  const webviewRef = React.useRef<WebView>(null);

  const setRef = React.useMemo(() => mergeRefs(webviewRef, {}, ref), [webviewRef, ref]);

  const emit = React.useCallback(
    (detail: BridgeMessage<any>) => {
      webviewRef.current?.injectJavaScript(getInjectEventScript(detail));
    },
    [webviewRef]
  );

  // serializable props, action names.

  const smartActions = Object.entries(marshalProps).reduce<{
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

  // When the `marshalProps` change, emit them to the webview.
  React.useEffect(() => {
    emit({ type: '$$props', data: smartActions });
  }, [emit, smartActions]);

  return (
    <WebView
      webviewDebuggingEnabled={__DEV__}
      originWhitelist={['*']}
      allowFileAccess
      allowFileAccessFromFileURLs
      allowsAirPlayForMediaPlayback
      allowsFullscreenVideo
      {...dom}
      injectedJavaScriptBeforeContentLoaded={[
        getInjectEnvsScript(),
        // On first mount, inject `$$EXPO_INITIAL_PROPS` with the initial props.
        `window.$$EXPO_INITIAL_PROPS = ${JSON.stringify(smartActions)};true;`,
        dom?.injectedJavaScriptBeforeContentLoaded,
        'true;',
      ]
        .filter(Boolean)
        .join('\n')}
      ref={setRef}
      source={source}
      style={[
        dom?.style
          ? { flex: 1, backgroundColor: 'transparent' }
          : { backgroundColor: 'transparent' },
        dom?.style,
      ]}
      onMessage={(event) => {
        const { type, data } = JSON.parse(event.nativeEvent.data);

        if (type === NATIVE_ACTION) {
          if (!marshalProps || !marshalProps[data.actionId]) {
            throw new Error(`Native action "${data.actionId}" is not defined.`);
          }
          if (!(marshalProps[data.actionId] instanceof Function)) {
            throw new Error(`Native action "${data.actionId}" is not a function.`);
          }

          const action = marshalProps[data.actionId];

          const emitError = (error) => {
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
            // Send async results back to the DOM proxy for return values.
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
            const value = action(...data.args);
            if (value instanceof Promise) {
              return value
                .then((result) => {
                  emitResolve(result);
                })
                .catch((error) => {
                  emitError(error);
                });
            } else {
              // Send async results back to the webview proxy for return values.
              return emitResolve(value);
            }
          } catch (error) {
            return emitError(error);
          }
        } else {
          dom?.onMessage?.(event);
        }
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

export default RawWebView;
