import { BridgeMessage, JSONValue } from './dom.types';
export declare function _emitGlobalEvent<TData extends JSONValue>(message: BridgeMessage<TData>): void;
export declare const addGlobalDomEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
//# sourceMappingURL=global-events.d.ts.map