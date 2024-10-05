// A webview without babel to test faster.
import React from 'react';
import { AppState } from 'react-native';

import type { BridgeMessage, DOMProps, WebViewProps, WebViewRef } from './dom.types';
import {
  getInjectBodySizeObserverScript,
  getInjectEventScript,
  getInjectEnvsScript,
  MATCH_CONTENTS_EVENT,
  NATIVE_ACTION,
  NATIVE_ACTION_RESULT,
} from './injection';

interface Props {
  dom: DOMProps;
  source: {
    uri: string;
  };
}

const RawWebView = React.forwardRef<object, Props>(({ dom, source, ...marshalProps }, ref) => {
  if (ref != null && typeof ref == 'object' && ref.current == null) {
    ref.current = new Proxy(
      {},
      {
        get(target, prop) {
          const propName = String(prop);
          return function (...args) {
            const serializedArgs = args.map((arg) => JSON.stringify(arg)).join(',');
            webviewRef.current?.injectJavaScript(
              `window._domRefProxy.${propName}(${serializedArgs})`
            );
          };
        },
      }
    );
  }

  const webView = dom.useExpoDOMWebView
    ? require('@expo/dom-webview').WebView
    : require('react-native-webview').WebView;
  const webviewRef = React.useRef<WebViewRef>(null);
  const [containerStyle, setContainerStyle] = React.useState<WebViewProps['containerStyle']>(null);

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

  return React.createElement(webView, {
    webviewDebuggingEnabled: __DEV__,
    // Make iOS scrolling feel native.
    decelerationRate: 'normal',
    originWhitelist: ['*'],
    allowFileAccess: true,
    allowFileAccessFromFileURLs: true,
    allowsAirPlayForMediaPlayback: true,
    allowsFullscreenVideo: true,
    onContentProcessDidTerminate: () => {
      webviewRef.current?.reload();
    },
    onRenderProcessGone: () => {
      // Simulate iOS `onContentProcessDidTerminate` behavior to reload when the app is in foreground or back to foreground.
      if (AppState.currentState === 'active') {
        webviewRef.current?.reload();
        return;
      }
      const subscription = AppState.addEventListener('focus', () => {
        webviewRef.current?.reload();
        subscription.remove();
      });
    },
    containerStyle,
    ...dom,
    injectedJavaScriptBeforeContentLoaded: [
      getInjectEnvsScript(),
      // On first mount, inject `$$EXPO_INITIAL_PROPS` with the initial props.
      `window.$$EXPO_INITIAL_PROPS = ${JSON.stringify(smartActions)};true;`,
      dom?.matchContents ? getInjectBodySizeObserverScript() : null,
      dom?.injectedJavaScriptBeforeContentLoaded,
      'true;',
    ]
      .filter(Boolean)
      .join('\n'),
    ref: webviewRef,
    source,
    style: [
      dom?.style ? { flex: 1, backgroundColor: 'transparent' } : { backgroundColor: 'transparent' },
      dom?.style,
    ],
    onMessage: (event) => {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      if (type === MATCH_CONTENTS_EVENT) {
        if (dom?.matchContents) {
          setContainerStyle({
            width: data.width,
            height: data.height,
          });
        }
        return;
      }

      if (type === NATIVE_ACTION) {
        const action = marshalProps[data.actionId];
        if (action == null) {
          throw new Error(`Native action "${data.actionId}" is not defined.`);
        }
        if (typeof action !== 'function' || !(action instanceof Function)) {
          throw new Error(`Native action "${data.actionId}" is not a function.`);
        }

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
    },
  });
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
