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
     * @default true
     */
    useExpoDOMWebView?: boolean;
    /**
     * When enabled, DOM components can import and call Expo native modules
     * directly via a `globalThis.expo.modules` proxy, for example:
     *
     * ```ts
     * 'use dom';
     * import * as Haptics from 'expo-haptics';
     *
     * export default function MyComponent() {
     *   return (
     *     <button onClick={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}>
     *       Tap me
     *     </button>
     *   );
     * }
     * ```
     *
     * Only effective when `useExpoDOMWebView` is `true`. The proxy forwards calls
     * to the host JS runtime via a bridge that effectively runs arbitrary
     * JavaScript in that runtime, so any third-party script or script-injection
     * vulnerability in the DOM bundle gains the same capability. Leave disabled
     * unless the bundle is fully trusted.
     *
     * @default false
     */
    unstable_useExpoModulesBridge?: boolean;
    /**
     * Allows dynamically redirecting a component to a different source, for example a prebuilt version.
     * @internal
     */
    overrideUri?: string;
}
export {};
//# sourceMappingURL=dom.types.d.ts.map