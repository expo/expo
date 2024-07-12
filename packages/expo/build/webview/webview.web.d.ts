import { BridgeMessage, JSONValue } from './www-types';
export declare const emit: <TData extends JSONValue>(message: BridgeMessage<TData>) => void;
export declare const addEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
export declare const useBridge: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => {}[];
//# sourceMappingURL=webview.web.d.ts.map