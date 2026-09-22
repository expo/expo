var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = void 0;
var _asyncToGenerator2 = _interopRequireDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _objectWithoutProperties2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectWithoutProperties')
);
var _react = _interopRequireWildcard(require('react'));
var _reactNative = require('react-native');
var _codegenNativeCommands = _interopRequireDefault(
  require('react-native/Libraries/Utilities/codegenNativeCommands')
);
var _invariant = _interopRequireDefault(require('invariant'));
var _WebViewNativeComponent = require('./WebViewNativeComponent.windows');
var _WebViewShared = require('./WebViewShared');
var _WebView = _interopRequireDefault(require('./WebView.styles'));
var _jsxRuntime = require('react/jsx-runtime');
var _excluded = [
  'cacheEnabled',
  'originWhitelist',
  'startInLoadingState',
  'onNavigationStateChange',
  'onLoadStart',
  'onError',
  'onLoad',
  'onLoadEnd',
  'onLoadProgress',
  'onOpenWindow',
  'onSourceChanged',
  'onHttpError',
  'onMessage',
  'renderLoading',
  'renderError',
  'style',
  'containerStyle',
  'source',
  'nativeConfig',
  'onShouldStartLoadWithRequest',
  'useWebView2',
];
var _this = this,
  _jsxFileName =
    '/home/runner/work/react-native-webview/react-native-webview/src/WebView.windows.tsx';
function _interopRequireWildcard(e, t) {
  if ('function' == typeof WeakMap)
    var r = new WeakMap(),
      n = new WeakMap();
  return (_interopRequireWildcard = function _interopRequireWildcard(e, t) {
    if (!t && e && e.__esModule) return e;
    var o,
      i,
      f = { __proto__: null, default: e };
    if (null === e || ('object' != typeof e && 'function' != typeof e)) return f;
    if ((o = t ? n : r)) {
      if (o.has(e)) return o.get(e);
      o.set(e, f);
    }
    for (var _t in e)
      'default' !== _t &&
        {}.hasOwnProperty.call(e, _t) &&
        ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) &&
        (i.get || i.set)
          ? o(f, _t, i)
          : (f[_t] = e[_t]));
    return f;
  })(e, t);
}
var Commands = (0, _codegenNativeCommands.default)({
  supportedCommands: [
    'goBack',
    'goForward',
    'reload',
    'stopLoading',
    'injectJavaScript',
    'requestFocus',
    'clearCache',
    'postMessage',
    'loadUrl',
  ],
});
var resolveAssetSource = function resolveAssetSource(source) {
  return _reactNative.Image.resolveAssetSource(source);
};
var WebViewComponent = (0, _react.forwardRef)(function (_ref, ref) {
  var _ref$cacheEnabled = _ref.cacheEnabled,
    cacheEnabled = _ref$cacheEnabled === void 0 ? true : _ref$cacheEnabled,
    _ref$originWhitelist = _ref.originWhitelist,
    originWhitelist =
      _ref$originWhitelist === void 0
        ? _WebViewShared.defaultOriginWhitelist
        : _ref$originWhitelist,
    startInLoadingState = _ref.startInLoadingState,
    onNavigationStateChange = _ref.onNavigationStateChange,
    onLoadStart = _ref.onLoadStart,
    onError = _ref.onError,
    onLoad = _ref.onLoad,
    onLoadEnd = _ref.onLoadEnd,
    onLoadProgress = _ref.onLoadProgress,
    onOpenWindowProp = _ref.onOpenWindow,
    onSourceChanged = _ref.onSourceChanged,
    onHttpErrorProp = _ref.onHttpError,
    onMessageProp = _ref.onMessage,
    renderLoading = _ref.renderLoading,
    renderError = _ref.renderError,
    style = _ref.style,
    containerStyle = _ref.containerStyle,
    source = _ref.source,
    nativeConfig = _ref.nativeConfig,
    onShouldStartLoadWithRequestProp = _ref.onShouldStartLoadWithRequest,
    useWebView2 = _ref.useWebView2,
    otherProps = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var webViewRef = (0, _react.useRef)(null);
  var RCTWebViewString = useWebView2 ? 'RCTWebView2' : 'RCTWebView';
  var onShouldStartLoadWithRequestCallback = (0, _react.useCallback)(
    function (shouldStart, url, lockIdentifier) {
      if (lockIdentifier) {
        if (RCTWebViewString === 'RCTWebView') {
          _reactNative.NativeModules.RCTWebView.onShouldStartLoadWithRequestCallback(
            shouldStart,
            lockIdentifier
          );
        } else {
          _reactNative.NativeModules.RCTWebView2.onShouldStartLoadWithRequestCallback(
            shouldStart,
            lockIdentifier
          );
        }
      } else if (shouldStart) {
        Commands.loadUrl(webViewRef, url);
      }
    },
    [RCTWebViewString]
  );
  var _useWebViewLogic = (0, _WebViewShared.useWebViewLogic)({
      onNavigationStateChange: onNavigationStateChange,
      onLoad: onLoad,
      onError: onError,
      onHttpErrorProp: onHttpErrorProp,
      onLoadEnd: onLoadEnd,
      onLoadProgress: onLoadProgress,
      onLoadStart: onLoadStart,
      onMessageProp: onMessageProp,
      startInLoadingState: startInLoadingState,
      originWhitelist: originWhitelist,
      onShouldStartLoadWithRequestProp: onShouldStartLoadWithRequestProp,
      onShouldStartLoadWithRequestCallback: onShouldStartLoadWithRequestCallback,
      onOpenWindowProp: onOpenWindowProp,
    }),
    onLoadingStart = _useWebViewLogic.onLoadingStart,
    onShouldStartLoadWithRequest = _useWebViewLogic.onShouldStartLoadWithRequest,
    onMessage = _useWebViewLogic.onMessage,
    viewState = _useWebViewLogic.viewState,
    setViewState = _useWebViewLogic.setViewState,
    lastErrorEvent = _useWebViewLogic.lastErrorEvent,
    onHttpError = _useWebViewLogic.onHttpError,
    onLoadingError = _useWebViewLogic.onLoadingError,
    onLoadingFinish = _useWebViewLogic.onLoadingFinish,
    onLoadingProgress = _useWebViewLogic.onLoadingProgress,
    onOpenWindow = _useWebViewLogic.onOpenWindow;
  (0, _react.useImperativeHandle)(
    ref,
    function () {
      return {
        goForward: function goForward() {
          return Commands.goForward(webViewRef.current);
        },
        goBack: function goBack() {
          return Commands.goBack(webViewRef.current);
        },
        reload: function reload() {
          setViewState('LOADING');
          Commands.reload(webViewRef.current);
        },
        stopLoading: function stopLoading() {
          return Commands.stopLoading(webViewRef.current);
        },
        postMessage: function postMessage(data) {
          return Commands.postMessage(webViewRef.current, data);
        },
        injectJavaScript: function injectJavaScript(data) {
          return Commands.injectJavaScript(webViewRef.current, data);
        },
        requestFocus: function requestFocus() {
          return Commands.requestFocus(webViewRef.current);
        },
        clearCache: function clearCache() {
          return Commands.clearCache(webViewRef.current);
        },
        loadUrl: function loadUrl(url) {
          return Commands.loadUrl(webViewRef.current, url);
        },
      };
    },
    [setViewState, webViewRef]
  );
  var otherView = null;
  if (viewState === 'LOADING') {
    otherView = (renderLoading || _WebViewShared.defaultRenderLoading)();
  } else if (viewState === 'ERROR') {
    (0, _invariant.default)(lastErrorEvent != null, 'lastErrorEvent expected to be non-null');
    otherView = (renderError || _WebViewShared.defaultRenderError)(
      lastErrorEvent.domain,
      lastErrorEvent.code,
      lastErrorEvent.description
    );
  }
  var webViewStyles = [_WebView.default.container, _WebView.default.webView, style];
  var webViewContainerStyle = [_WebView.default.container, containerStyle];
  var NativeWebView = useWebView2
    ? _WebViewNativeComponent.RCTWebView2
    : _WebViewNativeComponent.RCTWebView;
  var webView = (0, _jsxRuntime.jsx)(
    NativeWebView,
    Object.assign(
      {},
      otherProps,
      {
        messagingEnabled: typeof onMessageProp === 'function',
        linkHandlingEnabled: typeof onOpenWindowProp === 'function',
        onLoadingError: onLoadingError,
        onLoadingFinish: onLoadingFinish,
        onLoadingProgress: onLoadingProgress,
        onLoadingStart: onLoadingStart,
        onHttpError: onHttpError,
        onMessage: onMessage,
        onShouldStartLoadWithRequest: onShouldStartLoadWithRequest,
        onOpenWindow: onOpenWindow,
        onSourceChanged: onSourceChanged,
        ref: webViewRef,
        source: resolveAssetSource(source),
        style: webViewStyles,
        cacheEnabled: cacheEnabled,
      },
      nativeConfig == null ? void 0 : nativeConfig.props
    ),
    'webViewKey'
  );
  return (0, _jsxRuntime.jsxs)(_reactNative.View, {
    style: webViewContainerStyle,
    children: [webView, otherView],
  });
});
var isFileUploadSupported = (function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* () {
    return false;
  });
  return function isFileUploadSupported() {
    return _ref2.apply(this, arguments);
  };
})();
var WebView = Object.assign(WebViewComponent, { isFileUploadSupported: isFileUploadSupported });
var _default = (exports.default = WebView);
