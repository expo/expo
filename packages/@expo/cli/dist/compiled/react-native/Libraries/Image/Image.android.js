var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _flattenStyle = _interopRequireDefault(require("../StyleSheet/flattenStyle"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var _TextAncestor = _interopRequireDefault(require("../Text/TextAncestor"));
var _ImageAnalyticsTagContext = _interopRequireDefault(require("./ImageAnalyticsTagContext"));
var _ImageInjection = _interopRequireDefault(require("./ImageInjection"));
var _ImageSourceUtils = require("./ImageSourceUtils");
var _ImageUtils = require("./ImageUtils");
var _ImageViewNativeComponent = _interopRequireDefault(require("./ImageViewNativeComponent"));
var _NativeImageLoaderAndroid = _interopRequireDefault(require("./NativeImageLoaderAndroid"));
var _resolveAssetSource = _interopRequireDefault(require("./resolveAssetSource"));
var _TextInlineImageNativeComponent = _interopRequireDefault(require("./TextInlineImageNativeComponent"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["height", "width"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var _requestId = 1;
function generateRequestId() {
  return _requestId++;
}
function getSize(url, success, failure) {
  return _NativeImageLoaderAndroid.default.getSize(url).then(function (sizes) {
    success(sizes.width, sizes.height);
  }).catch(failure || function () {
    console.warn('Failed to get size for image: ' + url);
  });
}
function getSizeWithHeaders(url, headers, success, failure) {
  return _NativeImageLoaderAndroid.default.getSizeWithHeaders(url, headers).then(function (sizes) {
    success(sizes.width, sizes.height);
  }).catch(failure || function () {
    console.warn('Failed to get size for image: ' + url);
  });
}
function prefetchWithMetadata(url, queryRootName, rootTag, callback) {
  prefetch(url, callback);
}
function prefetch(url, callback) {
  var requestId = generateRequestId();
  callback && callback(requestId);
  return _NativeImageLoaderAndroid.default.prefetchImage(url, requestId);
}
function abortPrefetch(requestId) {
  _NativeImageLoaderAndroid.default.abortRequest(requestId);
}
function queryCache(_x) {
  return _queryCache.apply(this, arguments);
}
function _queryCache() {
  _queryCache = (0, _asyncToGenerator2.default)(function* (urls) {
    return yield _NativeImageLoaderAndroid.default.queryCache(urls);
  });
  return _queryCache.apply(this, arguments);
}
var BaseImage = function BaseImage(props, forwardedRef) {
  var _source$, _ref, _props$ariaLabel, _props$ariaLabelledb, _props$ariaBusy, _props$accessibilityS, _props$ariaChecked, _props$accessibilityS2, _props$ariaDisabled, _props$accessibilityS3, _props$ariaExpanded, _props$accessibilityS4, _props$ariaSelected, _props$accessibilityS5;
  var source = (0, _ImageSourceUtils.getImageSourcesFromImageProps)(props) || {
    uri: undefined,
    width: undefined,
    height: undefined
  };
  var defaultSource = (0, _resolveAssetSource.default)(props.defaultSource);
  var loadingIndicatorSource = (0, _resolveAssetSource.default)(props.loadingIndicatorSource);
  if (props.children) {
    throw new Error('The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.');
  }
  if (props.defaultSource && props.loadingIndicatorSource) {
    throw new Error('The <Image> component cannot have defaultSource and loadingIndicatorSource at the same time. Please use either defaultSource or loadingIndicatorSource.');
  }
  var style;
  var sources;
  if (Array.isArray(source)) {
    style = (0, _flattenStyle.default)([styles.base, props.style]);
    sources = source;
  } else {
    var _source$width = source.width,
      _width = _source$width === void 0 ? props.width : _source$width,
      _source$height = source.height,
      _height = _source$height === void 0 ? props.height : _source$height,
      uri = source.uri;
    style = (0, _flattenStyle.default)([{
      width: _width,
      height: _height
    }, styles.base, props.style]);
    sources = [source];
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
  }
  var height = props.height,
    width = props.width,
    restProps = (0, _objectWithoutProperties2.default)(props, _excluded);
  var onLoadStart = props.onLoadStart,
    onLoad = props.onLoad,
    onLoadEnd = props.onLoadEnd,
    onError = props.onError;
  var nativeProps = Object.assign({}, restProps, {
    style: style,
    shouldNotifyLoadEvents: !!(onLoadStart || onLoad || onLoadEnd || onError),
    src: sources,
    headers: (source == null ? void 0 : (_source$ = source[0]) == null ? void 0 : _source$.headers) || (source == null ? void 0 : source.headers),
    defaultSrc: defaultSource ? defaultSource.uri : null,
    loadingIndicatorSrc: loadingIndicatorSource ? loadingIndicatorSource.uri : null,
    ref: forwardedRef,
    accessibilityLabel: (_ref = (_props$ariaLabel = props['aria-label']) != null ? _props$ariaLabel : props.accessibilityLabel) != null ? _ref : props.alt,
    accessibilityLabelledBy: (_props$ariaLabelledb = props == null ? void 0 : props['aria-labelledby']) != null ? _props$ariaLabelledb : props == null ? void 0 : props.accessibilityLabelledBy,
    accessible: props.alt !== undefined ? true : props.accessible,
    accessibilityState: {
      busy: (_props$ariaBusy = props['aria-busy']) != null ? _props$ariaBusy : (_props$accessibilityS = props.accessibilityState) == null ? void 0 : _props$accessibilityS.busy,
      checked: (_props$ariaChecked = props['aria-checked']) != null ? _props$ariaChecked : (_props$accessibilityS2 = props.accessibilityState) == null ? void 0 : _props$accessibilityS2.checked,
      disabled: (_props$ariaDisabled = props['aria-disabled']) != null ? _props$ariaDisabled : (_props$accessibilityS3 = props.accessibilityState) == null ? void 0 : _props$accessibilityS3.disabled,
      expanded: (_props$ariaExpanded = props['aria-expanded']) != null ? _props$ariaExpanded : (_props$accessibilityS4 = props.accessibilityState) == null ? void 0 : _props$accessibilityS4.expanded,
      selected: (_props$ariaSelected = props['aria-selected']) != null ? _props$ariaSelected : (_props$accessibilityS5 = props.accessibilityState) == null ? void 0 : _props$accessibilityS5.selected
    }
  });
  var objectFit = style && style.objectFit ? (0, _ImageUtils.convertObjectFitToResizeMode)(style.objectFit) : null;
  var resizeMode = objectFit || props.resizeMode || style && style.resizeMode || 'cover';
  return (0, _jsxRuntime.jsx)(_ImageAnalyticsTagContext.default.Consumer, {
    children: function children(analyticTag) {
      var nativePropsWithAnalytics = analyticTag !== null ? Object.assign({}, nativeProps, {
        internal_analyticTag: analyticTag
      }) : nativeProps;
      return (0, _jsxRuntime.jsx)(_TextAncestor.default.Consumer, {
        children: function children(hasTextAncestor) {
          if (hasTextAncestor) {
            return (0, _jsxRuntime.jsx)(_TextInlineImageNativeComponent.default, {
              style: style,
              resizeMode: resizeMode,
              headers: nativeProps.headers,
              src: sources,
              ref: forwardedRef
            });
          }
          return (0, _jsxRuntime.jsx)(_ImageViewNativeComponent.default, Object.assign({}, nativePropsWithAnalytics, {
            resizeMode: resizeMode
          }));
        }
      });
    }
  });
};
var Image = React.forwardRef(BaseImage);
if (_ImageInjection.default.unstable_createImageComponent != null) {
  Image = _ImageInjection.default.unstable_createImageComponent(Image);
}
Image.displayName = 'Image';
Image.getSize = getSize;
Image.getSizeWithHeaders = getSizeWithHeaders;
Image.prefetch = prefetch;
Image.prefetchWithMetadata = prefetchWithMetadata;
Image.abortPrefetch = abortPrefetch;
Image.queryCache = queryCache;
Image.resolveAssetSource = _resolveAssetSource.default;
Image.propTypes = require('deprecated-react-native-prop-types').ImagePropTypes;
var styles = _StyleSheet.default.create({
  base: {
    overflow: 'hidden'
  }
});
module.exports = Image;