import { BridgeMessage, JSONValue } from './dom.types';

const globalListeners = new Set<(message: BridgeMessage<any>) => void>();

export function _emitGlobalEvent<TData extends JSONValue>(message: BridgeMessage<TData>) {
  globalListeners.forEach((listener) => listener(message));
}

export const addGlobalDomEventListener = <TData extends JSONValue>(
  onSubscribe: (message: BridgeMessage<TData>) => void
): (() => void) => {
  globalListeners.add(onSubscribe);
  return () => {
    globalListeners.delete(onSubscribe);
  };
};
