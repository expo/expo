import { useEffect } from 'react';
import { BridgeMessage, JSONValue } from './www-types';

export { StyleNoSelect } from './webview-wrapper';

export const emit = <TData extends JSONValue>(message: BridgeMessage<TData>) => {
  if (!isWebview()) {
    return;
  }
  (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
};

export const addEventListener = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
): (() => void) => {
  if (!isWebview()) {
    return () => {};
  }
  const listener = ({ detail }: any) => {
    onSubscribe(detail);
  };

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

export function _invokeNativeAction(actionId: string, args: any[]): Promise<any> {
  if (!isWebview()) {
    throw new Error('Cannot invoke native actions outside of a webview');
  }
  return new Promise((res, rej) => {
    const uid = Math.random().toString(36).slice(2);
    const sub = addEventListener<{
      uid: string;
      actionId: string;
      result?: any;
      error?: any;
    }>((message) => {
      console.log('[web] GOT:', message, Object.keys(message));
      if (
        message.type === '$$native_action_result' &&
        message.data.uid === uid &&
        message.data.actionId === actionId
      ) {
        console.log('[web] Complete:', message);
        // Unsubscribe from the event listener
        sub();
        if ('error' in message.data) {
          rej(errorFromJson(message.data.error));
        }
        res(message.data.result);
      }
    });
    emit({
      type: '$$native_action',
      data: {
        uid,
        actionId,
        args,
      },
    });
  });
}

export function _getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>> {
  return new Proxy(
    {},
    {
      get(target, prop) {
        console.log('actions.get', prop.toString());
        return async (...args) => {
          const resolvedProps = await Promise.all(
            args.map((arg, index) => {
              if (arg instanceof Promise) {
                console.warn(
                  `The promise passed to native action "${prop.toString()}(${new Array(index).fill(',').join('')}promise)" will be evaluated on the web-side before sending to native. This may not be what you want.`
                );
              }
              return arg;
            })
          );

          // Assert that props must be serialiazable
          resolvedProps.forEach((arg, index) => {
            if (!arg) return;

            console.log('actions.validate.' + index, arg);

            if (typeof arg === 'function') {
              console.error('Functions are not supported in arguments');
              throw new Error('Functions are not supported in arguments');
            } else if (typeof arg === 'object') {
              try {
                JSON.stringify(arg);
              } catch (e) {
                console.error('Functions are not supported in arguments');
                throw new Error(`Argument at index ${index} is not serializable`);
              }
            }
          });

          return _invokeNativeAction(prop.toString(), resolvedProps);
        };
      },
    }
  );
}

function errorFromJson(errorJson) {
  const error = new Error(errorJson.message);
  for (const key of Object.keys(errorJson)) {
    error[key] = errorJson[key];
  }

  return error;
}

export function isWebview() {
  return (
    typeof window !== 'undefined' &&
    // @ts-expect-error: Added via react-native-webview
    typeof window.ReactNativeWebView !== 'undefined'
  );
}
