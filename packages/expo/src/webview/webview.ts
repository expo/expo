import { useCallback, useRef } from 'react';

import { BridgeMessage, JSONValue } from './www-types';

import type WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

export const emit = <TData extends JSONValue>(message: BridgeMessage<TData>) => {
  // This is limited on native because the context is ambiguous. You can have multiple web views on native but only one native parent on web.
  throw new Error(
    'emit should be called from a web environment. Use the emit callback from useBridge on native.'
  );
};

export const addEventListener = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
): (() => void) => {
  // This is limited on native because the context is ambiguous. You can have multiple web views on native but only one native parent on web.
  throw new Error(
    'addEventListener should be called from a web environment. Use the emit callback from useBridge on native.'
  );
};

export const useBridge = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
) => {
  const ref = useRef<WebView>(null);

  const emit = useCallback(
    (message: BridgeMessage<TData>) => {
      const msg = `(function() {
  try { window.dispatchEvent(new CustomEvent("iframe-event",${JSON.stringify(message)})); } catch {}
  return true;
  })()`;
      ref.current?.injectJavaScript(msg);
    },
    [ref]
  );
  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        onSubscribe(JSON.parse(event.nativeEvent.data));
      } catch {}
    },
    [onSubscribe]
  );
  return [emit, { ref, onMessage }] as const;
};

export * from './www-types';
