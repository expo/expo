import type { BridgeMessage, JSONValue } from './www-types';

export { default as WebView } from './webview-wrapper';

// Skip all dom-only functions to give 'undefined is not a function' errors.

export const addEventListener:
  | undefined
  | (<TData extends JSONValue>(
      onSubscribe: (message: BridgeMessage<TData>) => void
    ) => () => void) = undefined;

export const getActionsObject:
  | undefined
  | (() => Record<string, (...args: any[]) => void | Promise<any>>) = undefined;
