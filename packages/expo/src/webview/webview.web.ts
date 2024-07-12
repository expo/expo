import { useEffect } from 'react';

type BridgeMessage<T> = {
  type: string;
  data: T;
};

export const emit = <T>(message: BridgeMessage<T>) => {
  (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
};

export const useBridge = <T>(onSubscribe: (message: BridgeMessage<T>) => void) => {
  useEffect(() => {
    const listener = ({ detail }: any) => onSubscribe(detail);

    // TODO: Add component ID to the event name to prevent conflicts with other components.
    window.addEventListener('iframe-event', listener);
    return () => {
      window.removeEventListener('iframe-event', listener);
    };
  }, [onSubscribe]);

  return [emit, {}];
};
