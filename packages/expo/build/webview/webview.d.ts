import { BridgeMessage, JSONValue } from './www-types';
import type WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
export declare const emit: <TData extends JSONValue>(message: BridgeMessage<TData>) => never;
export declare const addEventListener: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => (() => void);
export declare const useBridge: <TData extends JSONValue>(onSubscribe: (message: BridgeMessage<TData>) => void) => readonly [(message: BridgeMessage<TData>) => void, {
    readonly ref: import("react").RefObject<WebView<{}>>;
    readonly onMessage: (event: WebViewMessageEvent) => void;
}];
export * from './www-types';
//# sourceMappingURL=webview.d.ts.map