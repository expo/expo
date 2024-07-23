import { BridgeMessage, JSONValue } from './www-types';
export declare const emit: <TData extends JSONValue>(message: BridgeMessage<TData>) => never;
export declare function _invokeNativeAction(actionId: string, args: any[]): Promise<any>;
export declare function _getActionsObject(): Record<string, (...args: any[]) => void | Promise<any>>;
export { default as WebView } from './webview-wrapper';
export { addEventListener } from './global-events';
//# sourceMappingURL=internal.d.ts.map