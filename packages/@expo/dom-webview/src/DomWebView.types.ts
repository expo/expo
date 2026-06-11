import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

export interface DomWebViewProps
  extends ViewProps, AndroidProps, IosScrollViewProps, UnsupportedWebViewProps {
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
   * when the view loads.
   */
  injectedJavaScript?: string;

  /**
   * Set this to provide JavaScript that will be injected into the web page
   * once the webview is initialized but before the view loads any content.
   */
  injectedJavaScriptBeforeContentLoaded?: string;

  /**
   * Inject a JavaScript object to be accessed as a JSON string via JavaScript in the WebView.
   */
  injectedJavaScriptObject?: object;

  /**
   * Enables WebView remote debugging using Chrome (Android) or Safari (iOS).
   */
  webviewDebuggingEnabled?: boolean;

  /**
   * When enabled, the page can call Expo native modules via a
   * `globalThis.expo.modules` proxy, for example:
   *
   * ```ts
   * import * as Haptics from 'expo-haptics';
   * await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   * ```
   *
   * The proxy forwards calls to the host JS runtime via a bridge that
   * effectively runs arbitrary JavaScript in that runtime, so any third-party
   * script or script-injection vulnerability in the loaded content gains the
   * same capability. Leave disabled unless the content is fully trusted.
   *
   * @default false
   */
  useExpoModulesBridge?: boolean;

  /**
   * Whether HTML5 videos may play inline. When `false`, video elements are
   * forced into fullscreen playback. The default is `true`. Note: this differs
   * from `react-native-webview`, which defaults to `false`.
   *
   * Setting this prop after the webview is constructed has no effect.
   * @platform ios
   */
  allowsInlineMediaPlayback?: boolean;

  /**
   * Whether HTML5 video and audio require a user gesture before they can play.
   * When `true`, media will not autoplay; when `false`, media may play
   * automatically. The default is `true`, matching browser best practice.
   *
   * Setting this prop after the webview is constructed has no effect on iOS.
   */
  mediaPlaybackRequiresUserAction?: boolean;

  /**
   * Whether HTML5 videos can play in Picture-in-Picture mode. The default is
   * `true`. Note: this differs from `react-native-webview`, which defaults to
   * `false`.
   *
   * Setting this prop after the webview is constructed has no effect.
   * @platform ios
   */
  allowsPictureInPictureMediaPlayback?: boolean;

  /**
   * Whether HTML5 videos may stream over AirPlay. The default is `true`. Note:
   * this differs from `react-native-webview`, which defaults to `false`.
   *
   * Setting this prop after the webview is constructed has no effect.
   * @platform ios
   */
  allowsAirPlayForMediaPlayback?: boolean;

  /**
   * Function that is invoked when the webview calls `window.ReactNativeWebView.postMessage`.
   * Setting this property will inject this global into your webview.
   *
   * `window.ReactNativeWebView.postMessage` accepts one argument, `data`, which will be
   * available on the event object, `event.nativeEvent.data`. `data` must be a string.
   */
  onMessage?: (event: { nativeEvent: MessageEventData }) => void;

  /**
   * Function that is invoked when the `WebView` content process is terminated.
   * This can happen when the OS kills the WebView process to reclaim memory.
   * Use this to reload the WebView or show an error state.
   * @platform ios
   */
  onContentProcessDidTerminate?: (event: { nativeEvent: { url: string; title: string } }) => void;

  /**
   * Function that is invoked when the `WebView` render process is gone.
   * This can happen when the OS kills the WebView process to reclaim memory, or the process crashes.
   * Use this to reload the WebView or show an error state.
   * @platform android
   */
  onRenderProcessGone?: (event: {
    nativeEvent: { url: string; title: string; didCrash: boolean };
  }) => void;

  /**
   * Boolean value that determines whether a horizontal scroll indicator is
   * shown in the `WebView`. The default value is `true`.
   */
  showsHorizontalScrollIndicator?: boolean;

  /**
   * Boolean value that determines whether a vertical scroll indicator is
   * shown in the `WebView`. The default value is `true`.
   */
  showsVerticalScrollIndicator?: boolean;
}

interface IosScrollViewProps {
  /**
   * Boolean value that determines whether the web view bounces
   * when it reaches the edge of the content. The default value is `true`.
   * @platform ios
   */
  bounces?: boolean;

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
   * Boolean value that determines whether scrolling is enabled in the
   * `WebView`. The default value is `true`.
   * @platform ios
   */
  scrollEnabled?: boolean;

  /**
   * If the value of this property is true, the scroll view stops on multiples
   * of the scroll view’s bounds when the user scrolls.
   * The default value is false.
   * @platform ios
   */
  pagingEnabled?: boolean;

  /**
   * Controls whether to adjust the content inset for web views that are placed
   * behind a navigation bar, tab bar, or toolbar. The default value is `true`.
   *
   * When `true`, the safe-area insets of the nearest enclosing view controller
   * are added on top of `contentInset` before being applied to the web view's
   * scroll view.
   * @platform ios
   */
  automaticallyAdjustContentInsets?: boolean;

  /**
   * Controls whether to adjust the scroll indicator inset for web views that are
   * placed behind a navigation bar, tab bar, or toolbar. The default value is `true`,
   * matching the UIKit default. Set this to `false` to make the scroll indicator
   * span the full webview frame (e.g. for full-bleed layouts that draw their own
   * overlays). Note: this differs from `react-native-webview`, which defaults to
   * `false`.
   * @platform ios
   */
  automaticallyAdjustsScrollIndicatorInsets?: boolean;

  /**
   * The amount by which the web view content is inset from the edges of
   * the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.
   *
   * When `automaticallyAdjustContentInsets` is `true` (the default), the
   * enclosing view controller's safe-area insets are added on top of this
   * value. Set `automaticallyAdjustContentInsets={false}` to apply this value
   * verbatim.
   * @platform ios
   */
  contentInset?: ContentInsetProp;

  /**
   * Specifies how the safe area insets are used to modify the content area of
   * the scroll view. The default value is `"automatic"`, matching the UIKit
   * default — content is automatically inset by the enclosing view controller's
   * safe-area insets. Set this to `"never"` to render content edge-to-edge
   * regardless of safe areas. Note: this differs from `react-native-webview`,
   * which defaults to `"never"`.
   */
  contentInsetAdjustmentBehavior?: 'automatic' | 'scrollableAxes' | 'never' | 'always';

  /**
   * A Boolean value that determines whether scrolling is disabled in a particular direction.
   * The default value is `true`.
   * @platform ios
   */
  directionalLockEnabled?: boolean;
}

interface AndroidProps {
  /**
   * Allows to scroll inside the webview when used inside a scrollview.
   * Behaviour already existing on iOS.
   *
   * @platform android
   * @default true
   */
  nestedScrollEnabled?: boolean;
}

/**
 * Unsupported RNC WebView props that to suppress TypeScript errors.
 *
 * `allowFileAccess` and `allowFileAccessFromFileURLs` are intentionally listed
 * here even though file access is wired up natively — they're enabled
 * implicitly so DOM bundles served from `file://` work without configuration.
 * Listing them here lets the shared wrapper pass the props through without TS
 * errors.
 */
interface UnsupportedWebViewProps {
  originWhitelist?: string[];
  allowFileAccess?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  allowsFullscreenVideo?: boolean;
}

export type DomWebViewRef = {
  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   * Syntax:
   *
   * scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   */
  scrollTo({
    x,
    y,
    animated,
  }: {
    x?: number | undefined;
    y?: number | undefined;
    animated?: boolean | undefined;
  }): void;

  /**
   * Injects a JavaScript string into the `WebView` and executes it.
   */
  injectJavaScript: (script: string) => void;

  /**
   * Reloads the current page in the `WebView`.
   */
  reload: () => void;
};

export interface DomWebViewSource {
  /**
   * The URI to load in the `WebView`. Can be a local or remote file.
   */
  uri: string;
}

export interface ContentInsetProp {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

interface BaseEventData {
  url: string;
  title: string;
}

interface MessageEventData extends BaseEventData {
  data: string;
}
