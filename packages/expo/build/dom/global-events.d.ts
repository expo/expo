import { BridgeMessage, JSONValue } from './www-types';
export declare function _emitGlobalEvent<TData extends JSONValue>(message: BridgeMessage<TData>): void;
export declare const addEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
//# sourceMappingURL=global-events.d.ts.map