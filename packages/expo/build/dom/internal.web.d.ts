import { BridgeMessage, JSONValue } from './www-types';
export declare const addEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
export declare function getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>>;
//# sourceMappingURL=internal.web.d.ts.map