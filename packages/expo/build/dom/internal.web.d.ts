import { BridgeMessage, JSONValue } from './www-types';
export declare const emit: <TData extends JSONValue>(message: BridgeMessage<TData>) => void;
export declare const addEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
export declare function _invokeNativeAction(actionId: string, args: any[]): Promise<any>;
export declare function _getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>>;
//# sourceMappingURL=internal.web.d.ts.map