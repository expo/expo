import { useCallback, useRef } from 'react';
import type WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

type BridgeMessage<T> = {
  type: string;
  data: T;
};

export const emit = <T>(message: BridgeMessage<T>) => {
  throw new Error(
    'emit should be called from a web environment. Use the emit callback from useWebViewMessage on native.'
  );
};

export const useBridge = <T>(onSubscribe: (message: BridgeMessage<T>) => void) => {
  const ref = useRef<WebView>(null);

  const emit = useCallback(
    (message: BridgeMessage<T>) => {
      const msg = `(function() {
  try { window.dispatchEvent(new CustomEvent("iframe-event",{detail:${JSON.stringify(message)}})); } catch {}
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
