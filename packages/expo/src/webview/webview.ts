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

export const useBridge = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
) => {
  const ref = useRef<WebView>(null);

  const emit = useCallback(
    (detail: BridgeMessage<TData>) => {
      const msg = `(function() {
  try { window.dispatchEvent(new CustomEvent("iframe-event",${JSON.stringify({ detail })})); } catch {}
  return true;
  })()`;
      ref.current?.injectJavaScript(msg);
    },
    [ref]
  );
  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const { isTrusted, ...json } = JSON.parse(event.nativeEvent.data);
        onSubscribe(json);
      } catch {}
    },
    [onSubscribe]
  );
  return [emit, { ref, onMessage }] as const;
};

export function _invokeNativeAction(actionId: string, args: any[]): Promise<any> {
  throw new Error('internal method for webviews');
}

export function _getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>> {
  throw new Error('internal method for webviews');
}

export { default as WebView } from './webview-wrapper';

export * from './www-types';

export { addEventListener } from './global-events';

export function isWebview(): boolean {
  return false;
}
