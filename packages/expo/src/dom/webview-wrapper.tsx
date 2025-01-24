// A webview without babel to test faster.
import React from 'react';
import { AppState } from 'react-native';

import { getBaseURL } from './base';
import type { BridgeMessage, DOMProps, WebViewProps, WebViewRef } from './dom.types';
import { _emitGlobalEvent } from './global-events';
import {
  getInjectBodySizeObserverScript,
  getInjectEventScript,
  MATCH_CONTENTS_EVENT,
  NATIVE_ACTION,
  NATIVE_ACTION_RESULT,
  REGISTER_DOM_IMPERATIVE_HANDLE_PROPS,
} from './injection';
import ExpoDomWebView from './webview/ExpoDOMWebView';
import RNWebView from './webview/RNWebView';
import { useDebugZeroHeight } from './webview/useDebugZeroHeight';

interface Props {
  dom: DOMProps;
  filePath: string;
}

const RawWebView = React.forwardRef<object, Props>(({ dom, filePath, ...marshalProps }, ref) => {
  if (ref != null && typeof ref === 'object' && ref.current == null) {
    ref.current = new Proxy(
      {},
      {
        get(_, prop) {
          const propName = String(prop);
          if (domImperativeHandlePropsRef.current?.includes(propName)) {
            return function (...args) {
              const serializedArgs = args.map((arg) => JSON.stringify(arg)).join(',');
              webviewRef.current?.injectJavaScript(
                `window._domRefProxy.${propName}(${serializedArgs})`
              );
            };
          }
          if (typeof webviewRef.current?.[propName] === 'function') {
            return function (...args) {
              return webviewRef.current?.[propName](...args);
            };
          }
          return undefined;
        },
      }
    );
  }

  const webView = resolveWebView(dom?.useExpoDOMWebView ?? false);
  const webviewRef = React.useRef<WebViewRef>(null);
  const domImperativeHandlePropsRef = React.useRef<string[]>([]);
  const source = { uri: `${getBaseURL()}/${filePath}` };
  const [containerStyle, setContainerStyle] = React.useState<WebViewProps['containerStyle']>(null);

  const { debugZeroHeightStyle, debugOnLayout } = useDebugZeroHeight(dom);

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
    decelerationRate: process.env.EXPO_OS === 'ios' ? 'normal' : undefined,
    // This is a better default for integrating with native navigation.
    contentInsetAdjustmentBehavior: 'automatic',
    // This is the default in ScrollView and upstream native.
    automaticallyAdjustsScrollIndicatorInsets: true,
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
    ...dom,
    containerStyle: [containerStyle, debugZeroHeightStyle, dom?.containerStyle],
    onLayout: __DEV__ ? debugOnLayout : dom.onLayout,
    injectedJavaScriptBeforeContentLoaded: [
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

      if (type === REGISTER_DOM_IMPERATIVE_HANDLE_PROPS) {
        domImperativeHandlePropsRef.current = data;
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
      _emitGlobalEvent({ type, data });
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

export function resolveWebView(useExpoDOMWebView: boolean) {
  const webView = useExpoDOMWebView ? ExpoDomWebView : RNWebView;
  if (webView == null) {
    const moduleName = useExpoDOMWebView ? '@expo/dom-webview' : 'react-native-webview';
    throw new Error(
      `Unable to resolve the '${moduleName}' module. Make sure to install it with 'npx expo install ${moduleName}'.`
    );
  }
  return webView;
}

export default RawWebView;
