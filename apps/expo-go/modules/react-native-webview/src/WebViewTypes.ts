import { ReactElement, Component, ComponentProps } from 'react';
import {
  NativeSyntheticEvent,
  ViewProps,
  StyleProp,
  ViewStyle,
  NativeMethodsMixin,
  UIManagerStatic,
  NativeScrollEvent,
} from 'react-native';

import type NativeWebViewComponent from './RNCWebViewNativeComponent';

type WebViewCommands =
  | 'goForward'
  | 'goBack'
  | 'reload'
  | 'stopLoading'
  | 'postMessage'
  | 'injectJavaScript'
  | 'loadUrl'
  | 'requestFocus'
  | 'clearCache';

type AndroidWebViewCommands = 'clearHistory' | 'clearFormData';

interface RNCWebViewUIManager<Commands extends string> extends UIManagerStatic {
  getViewManagerConfig: (name: string) => {
    Commands: { [key in Commands]: number };
  };
}

export type RNCWebViewUIManagerAndroid = RNCWebViewUIManager<
  WebViewCommands | AndroidWebViewCommands
>;
export type RNCWebViewUIManagerIOS = RNCWebViewUIManager<WebViewCommands>;
export type RNCWebViewUIManagerMacOS = RNCWebViewUIManager<WebViewCommands>;
export type RNCWebViewUIManagerWindows = RNCWebViewUIManager<WebViewCommands>;

type WebViewState = 'IDLE' | 'LOADING' | 'ERROR';

interface BaseState {
  viewState: WebViewState;
}

interface NormalState extends BaseState {
  viewState: 'IDLE' | 'LOADING';
  lastErrorEvent: WebViewError | null;
}

interface ErrorState extends BaseState {
  viewState: 'ERROR';
  lastErrorEvent: WebViewError;
}

export type State = NormalState | ErrorState;

type Constructor<T> = new (...args: any[]) => T;

declare class NativeWebViewMacOSComponent extends Component<MacOSNativeWebViewProps> {}
declare const NativeWebViewMacOSBase: Constructor<NativeMethodsMixin> &
  typeof NativeWebViewMacOSComponent;
export class NativeWebViewMacOS extends NativeWebViewMacOSBase {}

declare class NativeWebViewWindowsComponent extends Component<WindowsNativeWebViewProps> {}
declare const NativeWebViewWindowsBase: Constructor<NativeMethodsMixin> &
  typeof NativeWebViewWindowsComponent;
export class NativeWebViewWindows extends NativeWebViewWindowsBase {}

export interface ContentInsetProp {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface WebViewNativeEvent {
  url: string;
  loading: boolean;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  lockIdentifier: number;
}

export interface WebViewNativeProgressEvent extends WebViewNativeEvent {
  progress: number;
}

export interface WebViewNavigation extends WebViewNativeEvent {
  navigationType:
    | 'click'
    | 'formsubmit'
    | 'backforward'
    | 'reload'
    | 'formresubmit'
    | 'other';
  mainDocumentURL?: string;
}

export interface ShouldStartLoadRequest extends WebViewNavigation {
  isTopFrame: boolean;
}

export interface FileDownload {
  downloadUrl: string;
}

export type DecelerationRateConstant = 'normal' | 'fast';

export interface WebViewMessage extends WebViewNativeEvent {
  data: string;
}

export interface WebViewError extends WebViewNativeEvent {
  /**
   * `domain` is only used on iOS and macOS
   */
  domain?: string;
  code: number;
  description: string;
}

export interface WebViewHttpError extends WebViewNativeEvent {
  description: string;
  statusCode: number;
}

export interface WebViewRenderProcessGoneDetail {
  didCrash: boolean;
}

export interface WebViewOpenWindow {
  targetUrl: string;
}

export type WebViewEvent = NativeSyntheticEvent<WebViewNativeEvent>;

export type WebViewProgressEvent =
  NativeSyntheticEvent<WebViewNativeProgressEvent>;

export type WebViewNavigationEvent = NativeSyntheticEvent<WebViewNavigation>;

export type ShouldStartLoadRequestEvent =
  NativeSyntheticEvent<ShouldStartLoadRequest>;

export type FileDownloadEvent = NativeSyntheticEvent<FileDownload>;

export type WebViewMessageEvent = NativeSyntheticEvent<WebViewMessage>;

export type WebViewErrorEvent = NativeSyntheticEvent<WebViewError>;

export type WebViewTerminatedEvent = NativeSyntheticEvent<WebViewNativeEvent>;

export type WebViewHttpErrorEvent = NativeSyntheticEvent<WebViewHttpError>;

export type WebViewRenderProcessGoneEvent =
  NativeSyntheticEvent<WebViewRenderProcessGoneDetail>;

export type WebViewOpenWindowEvent = NativeSyntheticEvent<WebViewOpenWindow>;

export type WebViewScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export type DataDetectorTypes =
  | 'phoneNumber'
  | 'link'
  | 'address'
  | 'calendarEvent'
  | 'trackingNumber'
  | 'flightNumber'
  | 'lookupSuggestion'
  | 'none'
  | 'all';

export type OverScrollModeType = 'always' | 'content' | 'never';

export type CacheMode =
  | 'LOAD_DEFAULT'
  | 'LOAD_CACHE_ONLY'
  | 'LOAD_CACHE_ELSE_NETWORK'
  | 'LOAD_NO_CACHE';

export type AndroidLayerType = 'none' | 'software' | 'hardware';

export interface WebViewSourceUri {
  /**
   * The URI to load in the `WebView`. Can be a local or remote file.
   */
  uri: string;

  /**
   * The HTTP Method to use. Defaults to GET if not specified.
   * NOTE: On Android, only GET and POST are supported.
   */
  method?: string;

  /**
   * Additional HTTP headers to send with the request.
   * NOTE: On Android, this can only be used with GET requests.
   */
  headers?: Object;

  /**
   * The HTTP body to send with the request. This must be a valid
   * UTF-8 string, and will be sent exactly as specified, with no
   * additional encoding (e.g. URL-escaping or base64) applied.
   * NOTE: On Android, this can only be used with POST requests.
   */
  body?: string;
}

export interface WebViewSourceHtml {
  /**
   * A static HTML page to display in the WebView.
   */
  html: string;
  /**
   * The base URL to be used for any relative links in the HTML.
   */
  baseUrl?: string;
}

export interface WebViewCustomMenuItems {
  /**
   * The unique key that will be added as a selector on the webview
   * Returned by the `onCustomMenuSelection` callback
   */
  key: string;
  /**
   * The label to appear on the UI Menu when selecting text
   */
  label: string;
}

export declare type SuppressMenuItem =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'replace'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'select'
  | 'selectAll'
  | 'translate'
  | 'lookup'
  | 'share';

export type WebViewSource = WebViewSourceUri | WebViewSourceHtml;

export interface ViewManager {
  shouldStartLoadWithLockIdentifier: Function;
}

export interface WebViewNativeConfig {
  /**
   * The native component used to render the WebView.
   */
  component?: typeof NativeWebViewMacOS | typeof NativeWebViewComponent;
  /**
   * Set props directly on the native component WebView. Enables custom props which the
   * original WebView doesn't pass through.
   */
  props?: Object;
  /**
   * Set the ViewManager to use for communication with the native side.
   * @platform ios, macos
   */
  viewManager?: ViewManager;
}

export type OnShouldStartLoadWithRequest = (
  event: ShouldStartLoadRequest
) => boolean;

export interface BasicAuthCredential {
  /**
   * A username used for basic authentication.
   */
  username: string;

  /**
   * A password used for basic authentication.
   */
  password: string;
}

export interface CommonNativeWebViewProps extends ViewProps {
  cacheEnabled?: boolean;
  incognito?: boolean;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  injectedJavaScriptForMainFrameOnly?: boolean;
  injectedJavaScriptBeforeContentLoadedForMainFrameOnly?: boolean;
  javaScriptCanOpenWindowsAutomatically?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  webviewDebuggingEnabled?: boolean;
  messagingEnabled: boolean;
  onScroll?: (event: WebViewScrollEvent) => void;
  onLoadingError: (event: WebViewErrorEvent) => void;
  onLoadingFinish: (event: WebViewNavigationEvent) => void;
  onLoadingProgress: (event: WebViewProgressEvent) => void;
  onLoadingStart: (event: WebViewNavigationEvent) => void;
  onHttpError: (event: WebViewHttpErrorEvent) => void;
  onMessage: (event: WebViewMessageEvent) => void;
  onShouldStartLoadWithRequest: (event: ShouldStartLoadRequestEvent) => void;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  // TODO: find a better way to type this.

  source: any;
  userAgent?: string;
  /**
   * Append to the existing user-agent. Overridden if `userAgent` is set.
   */
  applicationNameForUserAgent?: string;
  basicAuthCredential?: BasicAuthCredential;
}

export declare type ContentInsetAdjustmentBehavior =
  | 'automatic'
  | 'scrollableAxes'
  | 'never'
  | 'always';

export declare type MediaCapturePermissionGrantType =
  | 'grantIfSameHostElsePrompt'
  | 'grantIfSameHostElseDeny'
  | 'deny'
  | 'grant'
  | 'prompt';

export declare type ContentMode = 'recommended' | 'mobile' | 'desktop';

export interface MacOSNativeWebViewProps extends CommonNativeWebViewProps {
  allowingReadAccessToURL?: string;
  allowFileAccessFromFileURLs?: boolean;
  allowUniversalAccessFromFileURLs?: boolean;
  allowsBackForwardNavigationGestures?: boolean;
  allowsInlineMediaPlayback?: boolean;
  allowsPictureInPictureMediaPlayback?: boolean;
  allowsAirPlayForMediaPlayback?: boolean;
  allowsLinkPreview?: boolean;
  automaticallyAdjustContentInsets?: boolean;
  bounces?: boolean;
  contentInset?: ContentInsetProp;
  contentInsetAdjustmentBehavior?: ContentInsetAdjustmentBehavior;
  directionalLockEnabled?: boolean;
  hideKeyboardAccessoryView?: boolean;
  javaScriptEnabled?: boolean;
  pagingEnabled?: boolean;
  scrollEnabled?: boolean;
  useSharedProcessPool?: boolean;
  onContentProcessDidTerminate?: (event: WebViewTerminatedEvent) => void;
}

export interface WindowsNativeWebViewProps extends CommonNativeWebViewProps {
  testID?: string;
  linkHandlingEnabled?: boolean;
  onOpenWindow?: (event: WebViewOpenWindowEvent) => void;
  onSourceChanged?: (event: WebViewNavigationEvent) => void;
}

export interface WindowsWebViewProps extends WebViewSharedProps {
  /**
   * Boolean value that detenmines whether the web view should use the new chromium based edge webview.
   */
  useWebView2?: boolean;
  /**
   * Function that is invoked when the `WebView` should open a new window.
   *
   * This happens when the JS calls `window.open('http://someurl', '_blank')`
   * or when the user clicks on a `<a href="http://someurl" target="_blank">` link.
   *
   * Only works with `useWebView2` set to `true`.
   *
   * @platform windows
   */
  onOpenWindow?: (event: WebViewOpenWindowEvent) => void;

  /**
   * Function that is invoked when the `WebView` responds to a request to load a new resource.
   * Works only on Windows.
   *
   * Only works with `useWebView2` set to `true`.
   *
   * @platform windows
   */
  onSourceChanged?: (event: WebViewNavigationEvent) => void;
}

export interface IOSWebViewProps extends WebViewSharedProps {
  /**
   * Does not store any data within the lifetime of the WebView.
   */
  incognito?: boolean;

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
  decelerationRate?: DecelerationRateConstant | number;

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
   * Controls whether to adjust the content inset for web views that are
   * placed behind a navigation bar, tab bar, or toolbar. The default value
   * is `true`.
   * @platform ios
   */
  automaticallyAdjustContentInsets?: boolean;

  /**
   * Controls whether to adjust the scroll indicator inset for web views that are
   * placed behind a navigation bar, tab bar, or toolbar. The default value
   * is `false`. (iOS 13+)
   * @platform ios
   */
  automaticallyAdjustsScrollIndicatorInsets?: boolean;

  /**
   * This property specifies how the safe area insets are used to modify the
   * content area of the scroll view. The default value of this property is
   * "never". Available on iOS 11 and later.
   */
  contentInsetAdjustmentBehavior?: ContentInsetAdjustmentBehavior;

  /**
   * The amount by which the web view content is inset from the edges of
   * the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.
   * @platform ios
   */
  contentInset?: ContentInsetProp;

  /**
   * Defaults to `recommended`, which loads mobile content on iPhone
   * and iPad Mini but desktop content on other iPads.
   *
   * Possible values are:
   * - `'recommended'`
   * - `'mobile'`
   * - `'desktop'`
   * @platform ios
   */
  contentMode?: ContentMode;

  /**
   * Determines the types of data converted to clickable URLs in the web view's content.
   * By default only phone numbers are detected.
   *
   * You can provide one type or an array of many types.
   *
   * Possible values for `dataDetectorTypes` are:
   *
   * - `'phoneNumber'`
   * - `'link'`
   * - `'address'`
   * - `'calendarEvent'`
   * - `'none'`
   * - `'all'`
   *
   * With the new WebKit implementation, we have three new values:
   * - `'trackingNumber'`,
   * - `'flightNumber'`,
   * - `'lookupSuggestion'`,
   *
   * @platform ios
   */
  readonly dataDetectorTypes?: DataDetectorTypes | DataDetectorTypes[];

  /**
   * Boolean that determines whether HTML5 videos play inline or use the
   * native full-screen controller. The default value is `false`.
   *
   * **NOTE** : In order for video to play inline, not only does this
   * property need to be set to `true`, but the video element in the HTML
   * document must also include the `webkit-playsinline` attribute.
   * @platform ios
   */
  allowsInlineMediaPlayback?: boolean;
  /**
   * Boolean value that indicates whether HTML5 videos can play Picture in Picture.
   * The default value is `true`.
   *
   * @platform macos
   */
  allowsPictureInPictureMediaPlayback?: boolean;
  /**
   * A Boolean value indicating whether AirPlay is allowed. The default value is `false`.
   * @platform ios
   */
  allowsAirPlayForMediaPlayback?: boolean;
  /**
   * Hide the accessory view when the keyboard is open. Default is false to be
   * backward compatible.
   */
  hideKeyboardAccessoryView?: boolean;
  /**
   * A Boolean value indicating whether horizontal swipe gestures will trigger
   * back-forward list navigations.
   */
  allowsBackForwardNavigationGestures?: boolean;
  /**
   * A Boolean value indicating whether WebKit WebView should be created using a shared
   * process pool, enabling WebViews to share cookies and localStorage between each other.
   * Default is true but can be set to false for backwards compatibility.
   * @platform ios
   */
  useSharedProcessPool?: boolean;

  /**
   * The custom user agent string.
   * @platform ios
   */
  userAgent?: string;

  /**
   * A Boolean value that determines whether pressing on a link
   * displays a preview of the destination for the link.
   *
   * This property is available on devices that support 3D Touch.
   * In iOS 10 and later, the default value is `true`; before that, the default value is `false`.
   * @platform ios
   */
  allowsLinkPreview?: boolean;

  /**
   * Set true if shared cookies from HTTPCookieStorage should used for every load request.
   * The default value is `false`.
   * @platform ios
   */
  sharedCookiesEnabled?: boolean;

  /**
   * When set to true the hardware silent switch is ignored.
   * The default value is `false`.
   * @platform ios
   */
  ignoreSilentHardwareSwitch?: boolean;

  /**
   * Set true if StatusBar should be light when user watch video fullscreen.
   * The default value is `true`.
   * @platform ios
   */
  autoManageStatusBarEnabled?: boolean;

  /**
   * A Boolean value that determines whether scrolling is disabled in a particular direction.
   * The default value is `true`.
   * @platform ios
   */
  directionalLockEnabled?: boolean;

  /**
   * A Boolean value indicating whether web content can programmatically display the keyboard.
   *
   * When this property is set to true, the user must explicitly tap the elements in the
   * web view to display the keyboard (or other relevant input view) for that element.
   * When set to false, a focus event on an element causes the input view to be displayed
   * and associated with that element automatically.
   *
   * The default value is `true`.
   * @platform ios
   */
  keyboardDisplayRequiresUserAction?: boolean;

  /**
   * A String value that indicates which URLs the WebView's file can then
   * reference in scripts, AJAX requests, and CSS imports. This is only used
   * for WebViews that are loaded with a source.uri set to a `'file://'` URL.
   *
   * If not provided, the default is to only allow read access to the URL
   * provided in source.uri itself.
   * @platform ios
   */
  allowingReadAccessToURL?: string;

  /**
   * Boolean that sets whether JavaScript running in the context of a file
   * scheme URL should be allowed to access content from other file scheme URLs.
   * Including accessing content from other file scheme URLs
   * @platform ios
   */
  allowFileAccessFromFileURLs?: boolean;

  /**
   * Boolean that sets whether JavaScript running in the context of a file
   * scheme URL should be allowed to access content from any origin.
   * Including accessing content from other file scheme URLs
   * @platform ios
   */
  allowUniversalAccessFromFileURLs?: boolean;

  /**
   * Function that is invoked when the WebKit WebView content process gets terminated.
   * @platform ios
   */
  onContentProcessDidTerminate?: (event: WebViewTerminatedEvent) => void;

  /**
   * Function that is invoked when the `WebView` should open a new window.
   *
   * This happens when the JS calls `window.open('http://someurl', '_blank')`
   * or when the user clicks on a `<a href="http://someurl" target="_blank">` link.
   *
   * @platform ios
   */
  onOpenWindow?: (event: WebViewOpenWindowEvent) => void;

  /**
   * If `true` (default), loads the `injectedJavaScript` only into the main frame.
   * If `false`, loads it into all frames (e.g. iframes).
   * @platform ios
   */
  injectedJavaScriptForMainFrameOnly?: boolean;

  /**
   * If `true` (default), loads the `injectedJavaScriptBeforeContentLoaded` only into the main frame.
   * If `false`, loads it into all frames (e.g. iframes).
   * @platform ios
   */
  injectedJavaScriptBeforeContentLoadedForMainFrameOnly?: boolean;

  /**
   * Boolean value that determines whether a pull to refresh gesture is
   * available in the `WebView`. The default value is `false`.
   * If `true`, sets `bounces` automatically to `true`
   * @platform ios
   *
   */
  pullToRefreshEnabled?: boolean;

  /**
   * Boolean value that determines whether a pull to refresh gesture is
   * available in the `WebView`. The default value is `false`.
   * If `true`, sets `bounces` automatically to `true`
   * @platform ios
   *
   */
  refreshControlLightMode?: boolean;

  /**
   * Function that is invoked when the client needs to download a file.
   *
   * iOS 13+ only: If the webview navigates to a URL that results in an HTTP
   * response with a Content-Disposition header 'attachment...', then
   * this will be called.
   *
   * iOS 8+: If the MIME type indicates that the content is not renderable by the
   * webview, that will also cause this to be called. On iOS versions before 13,
   * this is the only condition that will cause this function to be called.
   *
   * The application will need to provide its own code to actually download
   * the file.
   *
   * If not provided, the default is to let the webview try to render the file.
   */
  onFileDownload?: (event: FileDownloadEvent) => void;

  /**
   * A Boolean value which, when set to `true`, indicates to WebKit that a WKWebView
   * will only navigate to app-bound domains. Once set, any attempt to navigate away
   * from an app-bound domain will fail with the error “App-bound domain failure.”
   *
   * Applications can specify up to 10 “app-bound” domains using a new
   * Info.plist key `WKAppBoundDomains`.
   * @platform ios
   */
  limitsNavigationsToAppBoundDomains?: boolean;

  /**
   * If false indicates to WebKit that a WKWebView will not interact with text, thus
   * not showing a text selection loop. Only applicable for iOS 14.5 or greater.
   *
   * Defaults to true.
   * @platform ios
   */
  textInteractionEnabled?: boolean;

  /**
   * This property specifies how to handle media capture permission requests.
   * Defaults to `prompt`, resulting in the user being prompted repeatedly.
   * Available on iOS 15 and later.
   */
  mediaCapturePermissionGrantType?: MediaCapturePermissionGrantType;

  /**
   * A Boolean value which, when set to `true`, WebView will be rendered with Apple Pay support.
   *  Once set, websites will be able to invoke apple pay from React Native Webview.
   *  This comes with a cost features like `injectJavaScript`, html5 History,`sharedCookiesEnabled`,
   *  `injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded` will not work
   * {@link https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes#Payment-Request-API ApplePay Doc}
   * if you require to send message to App , webpage has to explicitly call webkit message handler
   * and receive it on `onMessage` handler on react native side
   * @example
   *     window.webkit.messageHandlers.ReactNativeWebView.postMessage("hello apple pay")
   * @platform ios
   * The default value is false.
   */
  enableApplePay?: boolean;

  /**
   * An array of objects which will be shown when selecting text. An empty array will suppress the menu.
   * These will appear after a long press to select text.
   * @platform ios, android
   */
  menuItems?: WebViewCustomMenuItems[];

  /**
   * An array of strings which will be suppressed from the menu.
   * @platform ios
   */
  suppressMenuItems?: SuppressMenuItem[];

  /**
   * The function fired when selecting a custom menu item created by `menuItems`.
   * It passes a WebViewEvent with a `nativeEvent`, where custom keys are passed:
   * `customMenuKey`: the string of the menu item
   * `selectedText`: the text selected on the document
   * @platform ios, android
   */
  onCustomMenuSelection?: (event: {
    nativeEvent: {
      label: string;
      key: string;
      selectedText: string;
    };
  }) => void;

  /**
   * A Boolean value that indicates whether the webview shows warnings for suspected
   * fraudulent content, such as malware or phishing attempts.
   * @platform ios
   */
  fraudulentWebsiteWarningEnabled?: boolean;
}

export interface MacOSWebViewProps extends WebViewSharedProps {
  /**
   * Does not store any data within the lifetime of the WebView.
   */
  incognito?: boolean;

  /**
   * Boolean value that determines whether the web view bounces
   * when it reaches the edge of the content. The default value is `true`.
   * @platform macos
   */
  bounces?: boolean;

  /**
   * Boolean value that determines whether scrolling is enabled in the
   * `WebView`. The default value is `true`.
   * @platform macos
   */
  scrollEnabled?: boolean;

  /**
   * If the value of this property is true, the scroll view stops on multiples
   * of the scroll view’s bounds when the user scrolls.
   * The default value is false.
   * @platform macos
   */
  pagingEnabled?: boolean;

  /**
   * Controls whether to adjust the content inset for web views that are
   * placed behind a navigation bar, tab bar, or toolbar. The default value
   * is `true`.
   * @platform macos
   */
  automaticallyAdjustContentInsets?: boolean;

  /**
   * This property specifies how the safe area insets are used to modify the
   * content area of the scroll view. The default value of this property is
   * "never". Available on iOS 11 and later.
   */
  contentInsetAdjustmentBehavior?: ContentInsetAdjustmentBehavior;

  /**
   * The amount by which the web view content is inset from the edges of
   * the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.
   * @platform macos
   */
  contentInset?: ContentInsetProp;

  /**
   * Boolean that determines whether HTML5 videos play inline or use the
   * native full-screen controller. The default value is `false`.
   *
   * **NOTE** : In order for video to play inline, not only does this
   * property need to be set to `true`, but the video element in the HTML
   * document must also include the `webkit-playsinline` attribute.
   * @platform macos
   */
  allowsInlineMediaPlayback?: boolean;
  /**
   * Boolean value that indicates whether HTML5 videos can play Picture in Picture.
   * The default value is `true`.
   *
   * @platform ios
   */
  allowsPictureInPictureMediaPlayback?: boolean;
  /**
   * A Boolean value indicating whether AirPlay is allowed. The default value is `false`.
   * @platform macos
   */
  allowsAirPlayForMediaPlayback?: boolean;
  /**
   * Hide the accessory view when the keyboard is open. Default is false to be
   * backward compatible.
   */
  hideKeyboardAccessoryView?: boolean;
  /**
   * A Boolean value indicating whether horizontal swipe gestures will trigger
   * back-forward list navigations.
   */
  allowsBackForwardNavigationGestures?: boolean;
  /**
   * A Boolean value indicating whether WebKit WebView should be created using a shared
   * process pool, enabling WebViews to share cookies and localStorage between each other.
   * Default is true but can be set to false for backwards compatibility.
   * @platform macos
   */
  useSharedProcessPool?: boolean;

  /**
   * The custom user agent string.
   */
  userAgent?: string;

  /**
   * A Boolean value that determines whether pressing on a link
   * displays a preview of the destination for the link.
   *
   * This property is available on devices that support Force Touch trackpad.
   * @platform macos
   */
  allowsLinkPreview?: boolean;

  /**
   * Set true if shared cookies from HTTPCookieStorage should used for every load request.
   * The default value is `false`.
   * @platform macos
   */
  sharedCookiesEnabled?: boolean;

  /**
   * A Boolean value that determines whether scrolling is disabled in a particular direction.
   * The default value is `true`.
   * @platform macos
   */
  directionalLockEnabled?: boolean;

  /**
   * A Boolean value indicating whether web content can programmatically display the keyboard.
   *
   * When this property is set to true, the user must explicitly tap the elements in the
   * web view to display the keyboard (or other relevant input view) for that element.
   * When set to false, a focus event on an element causes the input view to be displayed
   * and associated with that element automatically.
   *
   * The default value is `true`.
   * @platform macos
   */
  keyboardDisplayRequiresUserAction?: boolean;

  /**
   * A String value that indicates which URLs the WebView's file can then
   * reference in scripts, AJAX requests, and CSS imports. This is only used
   * for WebViews that are loaded with a source.uri set to a `'file://'` URL.
   *
   * If not provided, the default is to only allow read access to the URL
   * provided in source.uri itself.
   * @platform macos
   */
  allowingReadAccessToURL?: string;

  /**
   * Boolean that sets whether JavaScript running in the context of a file
   * scheme URL should be allowed to access content from other file scheme URLs.
   * Including accessing content from other file scheme URLs
   * @platform macos
   */
  allowFileAccessFromFileURLs?: boolean;

  /**
   * Boolean that sets whether JavaScript running in the context of a file
   * scheme URL should be allowed to access content from any origin.
   * Including accessing content from other file scheme URLs
   * @platform macos
   */
  allowUniversalAccessFromFileURLs?: boolean;

  /**
   * Function that is invoked when the WebKit WebView content process gets terminated.
   * @platform macos
   */
  onContentProcessDidTerminate?: (event: WebViewTerminatedEvent) => void;
}

export interface AndroidWebViewProps extends WebViewSharedProps {
  onNavigationStateChange?: (event: WebViewNavigation) => void;
  onContentSizeChange?: (event: WebViewEvent) => void;

  /**
   * Function that is invoked when the `WebView` process crashes or is killed by the OS.
   * Works only on Android (minimum API level 26).
   */
  onRenderProcessGone?: (event: WebViewRenderProcessGoneEvent) => void;

  /**
   * Function that is invoked when the `WebView` should open a new window.
   *
   * This happens when the JS calls `window.open('http://someurl', '_blank')`
   * or when the user clicks on a `<a href="http://someurl" target="_blank">` link.
   *
   * @platform android
   */
  onOpenWindow?: (event: WebViewOpenWindowEvent) => void;

  /**
   * https://developer.android.com/reference/android/webkit/WebSettings.html#setCacheMode(int)
   * Set the cacheMode. Possible values are:
   *
   * - `'LOAD_DEFAULT'` (default)
   * - `'LOAD_CACHE_ELSE_NETWORK'`
   * - `'LOAD_NO_CACHE'`
   * - `'LOAD_CACHE_ONLY'`
   *
   * @platform android
   */
  cacheMode?: CacheMode;

  /**
   * https://developer.android.com/reference/android/view/View#setOverScrollMode(int)
   * Sets the overScrollMode. Possible values are:
   *
   * - `'always'` (default)
   * - `'content'`
   * - `'never'`
   *
   * @platform android
   */
  overScrollMode?: OverScrollModeType;

  /**
   * Boolean that controls whether the web content is scaled to fit
   * the view and enables the user to change the scale. The default value
   * is `true`.
   */
  scalesPageToFit?: boolean;

  /**
   * Sets whether Geolocation is enabled. The default is false.
   * @platform android
   */
  geolocationEnabled?: boolean;

  /**
   * Boolean that sets whether JavaScript running in the context of a file
   * scheme URL should be allowed to access content from other file scheme URLs.
   * Including accessing content from other file scheme URLs
   * @platform android
   */
  allowFileAccessFromFileURLs?: boolean;

  /**
   * Boolean that sets whether JavaScript running in the context of a file
   * scheme URL should be allowed to access content from any origin.
   * Including accessing content from other file scheme URLs
   * @platform android
   */
  allowUniversalAccessFromFileURLs?: boolean;

  /**
   * Sets whether the webview allow access to file system.
   * @platform android
   */
  allowFileAccess?: boolean;

  /**
   * Used on Android only, controls whether form autocomplete data should be saved
   * @platform android
   */
  saveFormDataDisabled?: boolean;

  /**
   * Boolean value to set whether the WebView supports multiple windows. Used on Android only
   * The default value is `true`.
   * @platform android
   */
  setSupportMultipleWindows?: boolean;

  /**
   * https://developer.android.com/reference/android/webkit/WebView#setLayerType(int,%20android.graphics.Paint)
   * Sets the layerType. Possible values are:
   *
   * - `'none'` (default)
   * - `'software'`
   * - `'hardware'`
   *
   * @platform android
   */
  androidLayerType?: AndroidLayerType;

  /**
   * Boolean value to enable third party cookies in the `WebView`. Used on
   * Android Lollipop and above only as third party cookies are enabled by
   * default on Android Kitkat and below and on iOS. The default value is `true`.
   * @platform android
   */
  thirdPartyCookiesEnabled?: boolean;

  /**
   * Boolean value to control whether DOM Storage is enabled. Used only in
   * Android.
   * @platform android
   */
  domStorageEnabled?: boolean;

  /**
   * Sets the user-agent for the `WebView`.
   * @platform android
   */
  userAgent?: string;

  /**
   * Sets number that controls text zoom of the page in percent.
   * @platform android
   */
  textZoom?: number;

  /**
   * Specifies the mixed content mode. i.e WebView will allow a secure origin to load content from any other origin.
   *
   * Possible values for `mixedContentMode` are:
   *
   * - `'never'` (default) - WebView will not allow a secure origin to load content from an insecure origin.
   * - `'always'` - WebView will allow a secure origin to load content from any other origin, even if that origin is insecure.
   * - `'compatibility'` -  WebView will attempt to be compatible with the approach of a modern web browser with regard to mixed content.
   * @platform android
   */
  mixedContentMode?: 'never' | 'always' | 'compatibility';

  /**
   * Sets ability to open fullscreen videos on Android devices.
   */
  allowsFullscreenVideo?: boolean;

  /**
   * Configuring Dark Theme
   *
   * *NOTE* : The force dark setting is not persistent. You must call the static method every time your app process is started.
   *
   * *NOTE* : The change from day<->night mode is a configuration change so by default the activity will be restarted
   * and pickup the new values to apply the theme.
   * Take care when overriding this default behavior to ensure this method is still called when changes are made.
   *
   * @platform android
   */
  forceDarkOn?: boolean;

  /**
   * Boolean value to control whether pinch zoom is enabled. Used only in Android.
   * Default to true
   *
   * @platform android
   */
  setBuiltInZoomControls?: boolean;

  /**
   * Boolean value to control whether built-in zooms controls are displayed. Used only in Android.
   * Default to false
   * Controls will always be hidden if setBuiltInZoomControls is set to `false`
   *
   * @platform android
   */
  setDisplayZoomControls?: boolean;

  /**
   * Allows to scroll inside the webview when used inside a scrollview.
   * Behaviour already existing on iOS.
   * Default to false
   *
   * @platform android
   */
  nestedScrollEnabled?: boolean;

  /**
   * Sets the minimum font size.
   * A non-negative integer between 1 and 72. Any number outside the specified range will be pinned.
   * Default is 8.
   * @platform android
   */
  minimumFontSize?: number;

  /**
   * Sets the message to be shown in the toast when downloading via the webview.
   * Default is 'Downloading'.
   * @platform android
   */
  downloadingMessage?: string;

  /**
   * Sets the message to be shown in the toast when webview is unable to download due to permissions issue.
   * Default is 'Cannot download files as permission was denied. Please provide permission to write to storage, in order to download files.'.
   * @platform android
   */
  lackPermissionToDownloadMessage?: string;

  /**
   * Boolean value to control whether webview can play media protected by DRM.
   * Default is false.
   * @platform android
   */
  allowsProtectedMedia?: boolean;
}

export interface WebViewSharedProps extends ViewProps {
  /**
   * Loads static html or a uri (with optional headers) in the WebView.
   */
  source?: WebViewSource;

  /**
   * Boolean value to enable JavaScript in the `WebView`. Used on Android only
   * as JavaScript is enabled by default on iOS. The default value is `true`.
   * @platform android
   */
  javaScriptEnabled?: boolean;

  /**
   * A Boolean value indicating whether JavaScript can open windows without user interaction.
   * The default value is `false`.
   */
  javaScriptCanOpenWindowsAutomatically?: boolean;

  /**
   * Stylesheet object to set the style of the container view.
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Function that returns a view to show if there's an error.
   */
  renderError?: (
    errorDomain: string | undefined,
    errorCode: number,
    errorDesc: string
  ) => ReactElement; // view to show if there's an error

  /**
   * Function that returns a loading indicator.
   */
  renderLoading?: () => ReactElement;

  /**
   * Function that is invoked when the `WebView` scrolls.
   */
  onScroll?: ComponentProps<typeof NativeWebViewComponent>['onScroll'];

  /**
   * Function that is invoked when the `WebView` has finished loading.
   */
  onLoad?: (event: WebViewNavigationEvent) => void;

  /**
   * Function that is invoked when the `WebView` load succeeds or fails.
   */
  onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void;

  /**
   * Function that is invoked when the `WebView` starts loading.
   */
  onLoadStart?: (event: WebViewNavigationEvent) => void;

  /**
   * Function that is invoked when the `WebView` load fails.
   */
  onError?: (event: WebViewErrorEvent) => void;

  /**
   * Function that is invoked when the `WebView` receives an error status code.
   * Works on iOS and Android (minimum API level 23).
   */
  onHttpError?: (event: WebViewHttpErrorEvent) => void;

  /**
   * Function that is invoked when the `WebView` loading starts or ends.
   */
  onNavigationStateChange?: (event: WebViewNavigation) => void;

  /**
   * Function that is invoked when the webview calls `window.ReactNativeWebView.postMessage`.
   * Setting this property will inject this global into your webview.
   *
   * `window.ReactNativeWebView.postMessage` accepts one argument, `data`, which will be
   * available on the event object, `event.nativeEvent.data`. `data` must be a string.
   */
  onMessage?: (event: WebViewMessageEvent) => void;

  /**
   * Function that is invoked when the `WebView` is loading.
   */
  onLoadProgress?: (event: WebViewProgressEvent) => void;

  /**
   * Boolean value that forces the `WebView` to show the loading view
   * on the first load.
   */
  startInLoadingState?: boolean;

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
   * If `true` (default; mandatory for Android), loads the `injectedJavaScript` only into the main frame.
   * If `false` (only supported on iOS and macOS), loads it into all frames (e.g. iframes).
   */
  injectedJavaScriptForMainFrameOnly?: boolean;

  /**
   * If `true` (default; mandatory for Android), loads the `injectedJavaScriptBeforeContentLoaded` only into the main frame.
   * If `false` (only supported on iOS and macOS), loads it into all frames (e.g. iframes).
   */
  injectedJavaScriptBeforeContentLoadedForMainFrameOnly?: boolean;

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

  /**
   * Boolean that determines whether HTML5 audio and video requires the user
   * to tap them before they start playing. The default value is `true`.
   */
  mediaPlaybackRequiresUserAction?: boolean;

  /**
   * List of origin strings to allow being navigated to. The strings allow
   * wildcards and get matched against *just* the origin (not the full URL).
   * If the user taps to navigate to a new page but the new page is not in
   * this whitelist, we will open the URL in Safari.
   * The default whitelisted origins are "http://*" and "https://*".
   */
  readonly originWhitelist?: string[];

  /**
   * Function that allows custom handling of any web view requests. Return
   * `true` from the function to continue loading the request and `false`
   * to stop loading. The `navigationType` is always `other` on android.
   */
  onShouldStartLoadWithRequest?: OnShouldStartLoadWithRequest;

  /**
   * Override the native component used to render the WebView. Enables a custom native
   * WebView which uses the same JavaScript as the original WebView.
   */
  nativeConfig?: WebViewNativeConfig;

  /**
   * Should caching be enabled. Default is true.
   */
  cacheEnabled?: boolean;

  /**
   * Append to the existing user-agent. Overridden if `userAgent` is set.
   */
  applicationNameForUserAgent?: string;

  /**
   * An object that specifies the credentials of a user to be used for basic authentication.
   */
  basicAuthCredential?: BasicAuthCredential;

  /**
   * Inject a JavaScript object to be accessed as a JSON string via JavaScript in the WebView.
   */
  injectedJavaScriptObject?: object;

  /**
   * Enables WebView remote debugging using Chrome (Android) or Safari (iOS).
   */
  webviewDebuggingEnabled?: boolean;
}
