import { BridgeMessage, JSONValue } from './dom.types';
import { DOM_EVENT, NATIVE_ACTION, NATIVE_ACTION_RESULT } from './injection';

const IS_DOM =
  typeof window !== 'undefined' &&
  // @ts-expect-error: Added via react-native-webview
  typeof window.ReactNativeWebView !== 'undefined';

const emit = <TData extends JSONValue>(message: BridgeMessage<TData>) => {
  if (!IS_DOM) {
    return;
  }
  (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
};

export const addEventListener = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
): (() => void) => {
  if (!IS_DOM) {
    return () => {};
  }
  const listener = ({ detail }: any) => {
    onSubscribe(detail);
  };

  // TODO: Add component ID to the event name to prevent conflicts with other components.
  window.addEventListener(DOM_EVENT, listener);
  return () => {
    window.removeEventListener(DOM_EVENT, listener);
  };
};

function invokeNativeAction(actionId: string, args: any[]): Promise<any> {
  if (!IS_DOM) {
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
      if (
        message.type === NATIVE_ACTION_RESULT &&
        message.data.uid === uid &&
        message.data.actionId === actionId
      ) {
        // Unsubscribe from the event listener
        sub();
        if ('error' in message.data) {
          rej(errorFromJson(message.data.error));
        }
        res(message.data.result);
      }
    });
    emit({
      type: NATIVE_ACTION,
      data: {
        uid,
        actionId,
        args,
      },
    });
  });
}

export function getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>> {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return async (...args: any[]) => {
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

          // Assert that props must be serializable
          resolvedProps.forEach((arg, index) => {
            if (!arg) return;

            if (typeof arg === 'function') {
              console.error('Functions are not supported in arguments');
              throw new Error('Functions are not supported in arguments');
            } else if (typeof arg === 'object') {
              try {
                JSON.stringify(arg);
              } catch (cause) {
                console.error('Functions are not supported in arguments');
                throw new Error(`Argument at index ${index} is not serializable`, { cause });
              }
            }
          });

          return invokeNativeAction(prop.toString(), resolvedProps);
        };
      },
    }
  );
}

function errorFromJson(errorJson: any) {
  const error = new Error(errorJson.message);
  for (const key of Object.keys(errorJson)) {
    error[key] = errorJson[key];
  }

  return error;
}
