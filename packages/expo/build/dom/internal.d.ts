import type { BridgeMessage, JSONValue } from './www-types';
export { default as WebView } from './webview-wrapper';
export declare const addEventListener: undefined | (<TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => () => void);
export declare const getActionsObject: undefined | (() => Record<string, (...args: any[]) => void | Promise<any>>);
//# sourceMappingURL=internal.d.ts.map