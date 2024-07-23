import { BridgeMessage, JSONValue } from './www-types';

export const emit = <TData extends JSONValue>(message: BridgeMessage<TData>) => {
  // This is limited on native because the context is ambiguous. You can have multiple web views on native but only one native parent on web.
  throw new Error(
    'emit should be called from a web environment. Use the emit callback from useBridge on native.'
  );
};

export function _invokeNativeAction(actionId: string, args: any[]): Promise<any> {
  throw new Error('internal method for webviews');
}

export function _getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>> {
  throw new Error('internal method for webviews');
}

export { default as WebView } from './webview-wrapper';

export { addEventListener } from './global-events';
