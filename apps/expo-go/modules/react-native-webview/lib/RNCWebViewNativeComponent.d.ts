import type { HostComponent, ViewProps } from 'react-native';
import { DirectEventHandler, Double, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
export type WebViewNativeEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
}>;
export type WebViewCustomMenuSelectionEvent = Readonly<{
    label: string;
    key: string;
    selectedText: string;
}>;
export type WebViewMessageEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
    data: string;
}>;
export type WebViewOpenWindowEvent = Readonly<{
    targetUrl: string;
}>;
export type WebViewHttpErrorEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
    description: string;
    statusCode: Int32;
}>;
export type WebViewErrorEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
    domain?: string;
    code: Int32;
    description: string;
}>;
export type WebViewNativeProgressEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
    progress: Double;
}>;
export type WebViewNavigationEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
    navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'formresubmit' | 'other';
    mainDocumentURL?: string;
}>;
export type ShouldStartLoadRequestEvent = Readonly<{
    url: string;
    loading: boolean;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier: Double;
    navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'formresubmit' | 'other';
    mainDocumentURL?: string;
    isTopFrame: boolean;
}>;
type ScrollEvent = Readonly<{
    contentInset: {
        bottom: Double;
        left: Double;
        right: Double;
        top: Double;
    };
    contentOffset: {
        y: Double;
        x: Double;
    };
    contentSize: {
        height: Double;
        width: Double;
    };
    layoutMeasurement: {
        height: Double;
        width: Double;
    };
    targetContentOffset?: {
        y: Double;
        x: Double;
    };
    velocity?: {
        y: Double;
        x: Double;
    };
    zoomScale?: Double;
    responderIgnoreScroll?: boolean;
}>;
type WebViewRenderProcessGoneEvent = Readonly<{
    didCrash: boolean;
}>;
type WebViewDownloadEvent = Readonly<{
    downloadUrl: string;
}>;
export interface NativeProps extends ViewProps {
    allowFileAccess?: boolean;
    allowsProtectedMedia?: boolean;
    allowsFullscreenVideo?: boolean;
    androidLayerType?: WithDefault<'none' | 'software' | 'hardware', 'none'>;
    cacheMode?: WithDefault<'LOAD_DEFAULT' | 'LOAD_CACHE_ELSE_NETWORK' | 'LOAD_NO_CACHE' | 'LOAD_CACHE_ONLY', 'LOAD_DEFAULT'>;
    domStorageEnabled?: boolean;
    downloadingMessage?: string;
    forceDarkOn?: boolean;
    geolocationEnabled?: boolean;
    lackPermissionToDownloadMessage?: string;
    messagingModuleName: string;
    minimumFontSize?: Int32;
    mixedContentMode?: WithDefault<'never' | 'always' | 'compatibility', 'never'>;
    nestedScrollEnabled?: boolean;
    onContentSizeChange?: DirectEventHandler<WebViewNativeEvent>;
    onRenderProcessGone?: DirectEventHandler<WebViewRenderProcessGoneEvent>;
    overScrollMode?: string;
    saveFormDataDisabled?: boolean;
    scalesPageToFit?: boolean;
    setBuiltInZoomControls?: boolean;
    setDisplayZoomControls?: boolean;
    setSupportMultipleWindows?: boolean;
    textZoom?: Int32;
    thirdPartyCookiesEnabled?: boolean;
    hasOnScroll?: boolean;
    allowingReadAccessToURL?: string;
    allowsBackForwardNavigationGestures?: boolean;
    allowsInlineMediaPlayback?: boolean;
    allowsPictureInPictureMediaPlayback?: boolean;
    allowsAirPlayForMediaPlayback?: boolean;
    allowsLinkPreview?: boolean;
    automaticallyAdjustContentInsets?: boolean;
    autoManageStatusBarEnabled?: boolean;
    bounces?: boolean;
    contentInset?: Readonly<{
        top?: Double;
        left?: Double;
        bottom?: Double;
        right?: Double;
    }>;
    contentInsetAdjustmentBehavior?: WithDefault<'never' | 'automatic' | 'scrollableAxes' | 'always', 'never'>;
    contentMode?: WithDefault<'recommended' | 'mobile' | 'desktop', 'recommended'>;
    dataDetectorTypes?: WithDefault<ReadonlyArray<'address' | 'link' | 'calendarEvent' | 'trackingNumber' | 'flightNumber' | 'lookupSuggestion' | 'phoneNumber' | 'all' | 'none'>, 'phoneNumber'>;
    decelerationRate?: Double;
    directionalLockEnabled?: boolean;
    enableApplePay?: boolean;
    hideKeyboardAccessoryView?: boolean;
    keyboardDisplayRequiresUserAction?: boolean;
    limitsNavigationsToAppBoundDomains?: boolean;
    mediaCapturePermissionGrantType?: WithDefault<'prompt' | 'grant' | 'deny' | 'grantIfSameHostElsePrompt' | 'grantIfSameHostElseDeny', 'prompt'>;
    pagingEnabled?: boolean;
    pullToRefreshEnabled?: boolean;
    refreshControlLightMode?: boolean;
    scrollEnabled?: boolean;
    sharedCookiesEnabled?: boolean;
    textInteractionEnabled?: boolean;
    useSharedProcessPool?: boolean;
    onContentProcessDidTerminate?: DirectEventHandler<WebViewNativeEvent>;
    onCustomMenuSelection?: DirectEventHandler<WebViewCustomMenuSelectionEvent>;
    onFileDownload?: DirectEventHandler<WebViewDownloadEvent>;
    menuItems?: ReadonlyArray<Readonly<{
        label: string;
        key: string;
    }>>;
    suppressMenuItems?: Readonly<string>[];
    hasOnFileDownload?: boolean;
    fraudulentWebsiteWarningEnabled?: boolean;
    allowFileAccessFromFileURLs?: boolean;
    allowUniversalAccessFromFileURLs?: boolean;
    applicationNameForUserAgent?: string;
    basicAuthCredential?: Readonly<{
        username: string;
        password: string;
    }>;
    cacheEnabled?: boolean;
    incognito?: boolean;
    injectedJavaScript?: string;
    injectedJavaScriptBeforeContentLoaded?: string;
    injectedJavaScriptForMainFrameOnly?: boolean;
    injectedJavaScriptBeforeContentLoadedForMainFrameOnly?: boolean;
    javaScriptCanOpenWindowsAutomatically?: boolean;
    javaScriptEnabled?: boolean;
    webviewDebuggingEnabled?: boolean;
    mediaPlaybackRequiresUserAction?: boolean;
    messagingEnabled: boolean;
    onLoadingError: DirectEventHandler<WebViewErrorEvent>;
    onLoadingFinish: DirectEventHandler<WebViewNavigationEvent>;
    onLoadingProgress: DirectEventHandler<WebViewNativeProgressEvent>;
    onLoadingStart: DirectEventHandler<WebViewNavigationEvent>;
    onHttpError: DirectEventHandler<WebViewHttpErrorEvent>;
    onMessage: DirectEventHandler<WebViewMessageEvent>;
    onOpenWindow?: DirectEventHandler<WebViewOpenWindowEvent>;
    hasOnOpenWindowEvent?: boolean;
    onScroll?: DirectEventHandler<ScrollEvent>;
    onShouldStartLoadWithRequest: DirectEventHandler<ShouldStartLoadRequestEvent>;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    newSource: Readonly<{
        uri?: string;
        method?: string;
        body?: string;
        headers?: ReadonlyArray<Readonly<{
            name: string;
            value: string;
        }>>;
        html?: string;
        baseUrl?: string;
    }>;
    userAgent?: string;
    injectedJavaScriptObject?: string;
}
export interface NativeCommands {
    goBack: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
    goForward: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
    reload: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
    stopLoading: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
    injectJavaScript: (viewRef: React.ElementRef<HostComponent<NativeProps>>, javascript: string) => void;
    requestFocus: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
    postMessage: (viewRef: React.ElementRef<HostComponent<NativeProps>>, data: string) => void;
    loadUrl: (viewRef: React.ElementRef<HostComponent<NativeProps>>, url: string) => void;
    clearFormData: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
    clearCache: (viewRef: React.ElementRef<HostComponent<NativeProps>>, includeDiskFiles: boolean) => void;
    clearHistory: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
}
export declare const Commands: NativeCommands;
declare const _default: HostComponent<NativeProps>;
export default _default;
