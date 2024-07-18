// A webview without babel to test faster.
import type { BridgeMessage } from './www-types';
import React from 'react';
import useMergeRefs from 'react-native-web/dist/modules/useMergeRefs';

import { WebView } from 'react-native-webview';
import { _emitGlobalEvent } from './global-events';

// const outputKey =
//   'file://' + process.env.EXPO_PROJECT_ROOT + '/__e2e__/tailwind-postcss/components/thing.tsx';

// const proxy = { uri: new URL('/_expo/@iframe?file=' + outputKey, window.location.href).toString() };

const RawWebView = React.forwardRef(({ actions, webview, ...props }, ref) => {
  const webviewRef = React.useRef<WebView>(null);

  const setRef = useMergeRefs(webviewRef, {}, ref);

  props.ref = setRef;

  const emit = React.useCallback(
    (detail: BridgeMessage<any>) => {
      console.log('emit', detail);
      const msg = `;(function() {
  try { 
  window.dispatchEvent(new CustomEvent("iframe-event",${JSON.stringify({ detail })})); 
  } catch (e) {}
  })();
  true;`;
      webviewRef.current?.injectJavaScript(msg);
    },
    [webviewRef]
  );

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
      {...props}
      style={[
        props.style
          ? { flex: 1, backgroundColor: 'transparent' }
          : { backgroundColor: 'transparent' },
        props.style,
      ]}
      onMessage={(event) => {
        const { type, data } = JSON.parse(event.nativeEvent.data);
        if (type === '$$native_action') {
          if (!actions || !actions[data.actionId]) {
            throw new Error(`Native action "${data.actionId}" is not defined.`);
          }
          if (!(actions[data.actionId] instanceof Function)) {
            throw new Error(`Native action "${data.actionId}" is not a function.`);
          }

          const action = actions[data.actionId];
          const fnName = `${data.actionId}(${data.args.join(', ')})`;

          const emitError = (error) => {
            console.log('[Native] error:', fnName, error);
            emit({
              type: '$$native_action_result',
              data: {
                uid: data.uid,
                actionId: data.actionId,
                error: serializeError(error),
              },
            });
          };
          const emitResolve = (result?: any) => {
            console.log('[Native] resolve:', fnName, result);
            // Send async results back to the webview proxy for return values.
            emit({
              type: '$$native_action_result',
              data: {
                uid: data.uid,
                actionId: data.actionId,
                result,
              },
            });
          };
          try {
            console.log(`[Native] Invoke: ${fnName}`);
            const value = action(...data.args);
            if (value instanceof Promise) {
              console.log(`[Native] Async: ${fnName}`, value);
              return value
                .then((result) => {
                  emitResolve(result);
                })
                .catch((error) => {
                  emitError(error);
                });
            } else {
              console.log(`[Native] Sync: ${fnName}`, value);

              // Send async results back to the webview proxy for return values.
              return emitResolve(value);
            }
          } catch (error) {
            return emitError(error);
          }
        } else {
          props.onMessage?.(event);
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

export default RawWebView;
