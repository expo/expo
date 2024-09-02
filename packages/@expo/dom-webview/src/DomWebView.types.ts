import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

export interface DomWebViewProps extends ViewProps, UnsupportedWebViewProps {
  /**
   * Loads static html or a uri (with optional headers) in the WebView.
   */
  source: DomWebViewSource;

  /**
   * Stylesheet object to set the style of the container view.
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Set this to provide JavaScript that will be injected into the web page
   * once the webview is initialized but before the view loads any content.
   */
  injectedJavaScriptBeforeContentLoaded?: string;

  /**
   * Enables WebView remote debugging using Chrome (Android) or Safari (iOS).
   */
  webviewDebuggingEnabled?: boolean;

  /**
   * Boolean value that determines whether scrolling is enabled in the
   * `WebView`. The default value is `true`.
   * @platform ios
   */
  scrollEnabled?: boolean;

  /**
   * A floating-point number that determines how quickly the scroll view
   * decelerates after the user lifts their finger. You may also use the
   * string shortcuts `"normal"` and `"fast"` which match the underlying iOS
   * settings for `UIScrollViewDecelerationRateNormal` and
   * `UIScrollViewDecelerationRateFast` respectively:
   *
   *   - normal: 0.998
   *   - fast: 0.99 (the default for iOS web view)
   * @platform ios
   */
  decelerationRate?: 'normal' | 'fast' | number;

  /**
   * Function that is invoked when the webview calls `window.ReactNativeWebView.postMessage`.
   * Setting this property will inject this global into your webview.
   *
   * `window.ReactNativeWebView.postMessage` accepts one argument, `data`, which will be
   * available on the event object, `event.nativeEvent.data`. `data` must be a string.
   */
  onMessage?: (event: { nativeEvent: MessageEventData }) => void;
}

/**
 * Unsupported RNC WebView props that to suppress TypeScript errors.
 */
interface UnsupportedWebViewProps {
  originWhitelist?: string[];
  allowFileAccess?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  allowsAirPlayForMediaPlayback?: boolean;
  allowsFullscreenVideo?: boolean;
}

export type DomWebViewRef = {
  injectJavaScript: (script: string) => void;
};

export interface DomWebViewSource {
  /**
   * The URI to load in the `WebView`. Can be a local or remote file.
   */
  uri: string;
}

interface BaseEventData {
  url: string;
  title: string;
}

interface MessageEventData extends BaseEventData {
  data: string;
}
