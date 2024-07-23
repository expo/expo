import { BridgeMessage, JSONValue } from './www-types';

const globalListeners = new Set<(message: BridgeMessage<any>) => void>();

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
};
