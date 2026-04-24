import { type MarshalledProps } from './dom-entry';
interface WebViewBridge {
    postMessage: (message: string) => void;
    injectedObjectJson: () => string;
}
/**
 * Whether the react-native-webview bridge is available in the current runtime.
 * Use this to branch on DOM Component context; use `getWebViewBridge()` to
 * actually interact with the bridge.
 */
export declare function hasWebViewBridge(): boolean;
/**
 * Returns the react-native-webview bridge for DOM Component code. Throws when
 * the bridge is not available (e.g. the same module being evaluated outside of
 * a WebView); guard with `hasWebViewBridge()` when the caller may run in both
 * contexts.
 */
export declare function getWebViewBridge(): WebViewBridge;
declare global {
    interface Window {
        $$EXPO_DOM_HOST_OS?: string;
        $$EXPO_INITIAL_PROPS?: MarshalledProps;
    }
}
export {};
//# sourceMappingURL=webview-bridge.d.ts.map