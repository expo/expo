import { BridgeMessage, JSONValue } from './www-types';

const globalListeners = new Set<(message: BridgeMessage<JSONValue>) => void>();

export function _emitGlobalEvent<TData extends JSONValue>(message: BridgeMessage<TData>) {
  globalListeners.forEach((listener) => listener(message));
}

export const addEventListener = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
): (() => void) => {
  globalListeners.add(onSubscribe);
  return () => {
    globalListeners.delete(onSubscribe);
  };
  // This is limited on native because the context is ambiguous. You can have multiple web views on native but only one native parent on web.
  throw new Error(
    'addEventListener should be called from a web environment. Use the emit callback from useBridge on native.'
  );
};
