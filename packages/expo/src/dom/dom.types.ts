import type { WebView, WebViewProps } from 'react-native-webview';

export type JSONValue = boolean | number | string | null | JSONArray | JSONObject;

export interface JSONArray extends Array<JSONValue> {}

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

export type WebViewRef = WebView;
export { WebViewProps };

export interface DOMProps extends Omit<WebViewProps, 'source'> {
  /**
   * Whether to resize the native WebView size based on the DOM content size.
   * @default false
   */
  matchContents?: boolean;
}
