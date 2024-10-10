import type { RNWebView, RNWebViewProps } from './webview/RNWebView';
export type JSONValue = boolean | number | string | null | JSONArray | JSONObject;
export interface JSONArray extends Array<JSONValue> {
}
export interface JSONObject {
    [key: string]: JSONValue | undefined;
}
export type BridgeMessage<TData extends JSONValue> = {
    type: string;
    data: TData;
};
/**
 * The return type of the init function for `useDOMImperativeHandle`.
 */
export interface DOMImperativeFactory {
    [key: string]: (...args: JSONValue[]) => void;
}
type RNWebViewRef = RNWebView;
export type WebViewRef = RNWebViewRef;
export type WebViewProps = RNWebViewProps;
export interface DOMProps extends Omit<RNWebViewProps, 'source'> {
    /**
     * Whether to resize the native WebView size based on the DOM content size.
     * @default false
     */
    matchContents?: boolean;
    /**
     * Whether to use the `@expo/dom-webview` as the underlying WebView implementation.
     * @default false
     */
    useExpoDOMWebView?: boolean;
}
export {};
//# sourceMappingURL=dom.types.d.ts.map