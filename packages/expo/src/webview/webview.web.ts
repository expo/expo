import { useEffect } from 'react';
import { BridgeMessage, JSONValue } from './www-types';

export const emit = <TData extends JSONValue>(message: BridgeMessage<TData>) => {
  (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
};

export const addEventListener = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
): (() => void) => {
  const listener = (detail: any) => onSubscribe(detail);

  // TODO: Add component ID to the event name to prevent conflicts with other components.
  window.addEventListener('iframe-event', listener);
  return () => {
    window.removeEventListener('iframe-event', listener);
  };
};

export const useBridge = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
) => {
  useEffect(() => addEventListener(onSubscribe), [onSubscribe]);
  return [emit, {}];
};
