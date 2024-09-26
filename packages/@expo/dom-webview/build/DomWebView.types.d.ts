import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
export interface DomWebViewProps extends ViewProps, AndroidProps, IosScrollViewProps, UnsupportedWebViewProps {
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
     * Function that is invoked when the webview calls `window.ReactNativeWebView.postMessage`.
     * Setting this property will inject this global into your webview.
     *
     * `window.ReactNativeWebView.postMessage` accepts one argument, `data`, which will be
     * available on the event object, `event.nativeEvent.data`. `data` must be a string.
     */
    onMessage?: (event: {
        nativeEvent: MessageEventData;
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
     * Controls whether to adjust the scroll indicator inset for web views that are
     * placed behind a navigation bar, tab bar, or toolbar. The default value
     * is `false`. (iOS 13+)
     * @platform ios
     */
    automaticallyAdjustsScrollIndicatorInsets?: boolean;
    /**
     * The amount by which the web view content is inset from the edges of
     * the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.
     * @platform ios
     */
    contentInset?: ContentInsetProp;
    /**
     * This property specifies how the safe area insets are used to modify the
     * content area of the scroll view. The default value of this property is
     * "never". Available on iOS 11 and later.
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
 */
interface UnsupportedWebViewProps {
    originWhitelist?: string[];
    allowFileAccess?: boolean;
    allowFileAccessFromFileURLs?: boolean;
    allowsAirPlayForMediaPlayback?: boolean;
    allowsFullscreenVideo?: boolean;
    automaticallyAdjustContentInsets?: boolean;
}
export type DomWebViewRef = {
    /**
     * Scrolls to a given x, y offset, either immediately or with a smooth animation.
     * Syntax:
     *
     * scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
     */
    scrollTo({ x, y, animated, }: {
        x?: number | undefined;
        y?: number | undefined;
        animated?: boolean | undefined;
    }): void;
    /**
     * Injects a JavaScript string into the `WebView` and executes it.
     */
    injectJavaScript: (script: string) => void;
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
export {};
//# sourceMappingURL=DomWebView.types.d.ts.map