import { BridgeMessage, JSONValue } from './dom.types';
export declare const addEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
export declare function getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>>;
//# sourceMappingURL=marshal.d.ts.map