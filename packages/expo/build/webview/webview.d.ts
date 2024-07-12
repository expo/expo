import type WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
type BridgeMessage<T> = {
    type: string;
    data: T;
};
export declare const emit: <T>(message: BridgeMessage<T>) => never;
export declare const useBridge: <T>(onSubscribe: (message: BridgeMessage<T>) => void) => readonly [(message: BridgeMessage<T>) => void, {
    readonly ref: import("react").RefObject<WebView<{}>>;
    readonly onMessage: (event: WebViewMessageEvent) => void;
}];
export {};
//# sourceMappingURL=webview.d.ts.map