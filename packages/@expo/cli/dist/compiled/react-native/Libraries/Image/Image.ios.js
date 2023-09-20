var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _flattenStyle = _interopRequireDefault(require("../StyleSheet/flattenStyle"));
var _StyleSheet = _interopRequireDefault(require("../StyleSheet/StyleSheet"));
var _ImageAnalyticsTagContext = _interopRequireDefault(require("./ImageAnalyticsTagContext"));
var _ImageInjection = _interopRequireDefault(require("./ImageInjection"));
var _ImageSourceUtils = require("./ImageSourceUtils");
var _ImageUtils = require("./ImageUtils");
var _ImageViewNativeComponent = _interopRequireDefault(require("./ImageViewNativeComponent"));
var _NativeImageLoaderIOS = _interopRequireDefault(require("./NativeImageLoaderIOS"));
var _resolveAssetSource = _interopRequireDefault(require("./resolveAssetSource"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["aria-busy", "aria-checked", "aria-disabled", "aria-expanded", "aria-selected", "height", "src", "width"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function getSize(uri, success, failure) {
  _NativeImageLoaderIOS.default.getSize(uri).then(function (_ref) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
      width = _ref2[0],
      height = _ref2[1];
    return success(width, height);
  }).catch(failure || function () {
    console.warn('Failed to get size for image ' + uri);
  });
}
function getSizeWithHeaders(uri, headers, success, failure) {
  return _NativeImageLoaderIOS.default.getSizeWithHeaders(uri, headers).then(function (sizes) {
    success(sizes.width, sizes.height);
  }).catch(failure || function () {
    console.warn('Failed to get size for image: ' + uri);
  });
}
function prefetchWithMetadata(url, queryRootName, rootTag) {
  if (_NativeImageLoaderIOS.default.prefetchImageWithMetadata) {
    return _NativeImageLoaderIOS.default.prefetchImageWithMetadata(url, queryRootName, rootTag ? rootTag : 0);
  } else {
    return _NativeImageLoaderIOS.default.prefetchImage(url);
  }
}
function prefetch(url) {
  return _NativeImageLoaderIOS.default.prefetchImage(url);
}
function queryCache(_x) {
  return _queryCache.apply(this, arguments);
}
function _queryCache() {
  _queryCache = (0, _asyncToGenerator2.default)(function* (urls) {
    return yield _NativeImageLoaderIOS.default.queryCache(urls);
  });
  return _queryCache.apply(this, arguments);
}
var BaseImage = function BaseImage(props, forwardedRef) {
  var _props$accessibilityS, _props$accessibilityS2, _props$accessibilityS3, _props$accessibilityS4, _props$accessibilityS5, _props$ariaLabel;
  var source = (0, _ImageSourceUtils.getImageSourcesFromImageProps)(props) || {
    uri: undefined,
    width: undefined,
    height: undefined
  };
  var sources;
  var style;
  if (Array.isArray(source)) {
    style = (0, _flattenStyle.default)([styles.base, props.style]) || {};
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
    }, styles.base, props.style]) || {};
    sources = [source];
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
  }
  var objectFit = style && style.objectFit ? (0, _ImageUtils.convertObjectFitToResizeMode)(style.objectFit) : null;
  var resizeMode = objectFit || props.resizeMode || style && style.resizeMode || 'cover';
  var tintColor = props.tintColor || style.tintColor;
  if (props.children != null) {
    throw new Error('The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.');
  }
  var ariaBusy = props['aria-busy'],
    ariaChecked = props['aria-checked'],
    ariaDisabled = props['aria-disabled'],
    ariaExpanded = props['aria-expanded'],
    ariaSelected = props['aria-selected'],
    height = props.height,
    src = props.src,
    width = props.width,
    restProps = (0, _objectWithoutProperties2.default)(props, _excluded);
  var _accessibilityState = {
    busy: ariaBusy != null ? ariaBusy : (_props$accessibilityS = props.accessibilityState) == null ? void 0 : _props$accessibilityS.busy,
    checked: ariaChecked != null ? ariaChecked : (_props$accessibilityS2 = props.accessibilityState) == null ? void 0 : _props$accessibilityS2.checked,
    disabled: ariaDisabled != null ? ariaDisabled : (_props$accessibilityS3 = props.accessibilityState) == null ? void 0 : _props$accessibilityS3.disabled,
    expanded: ariaExpanded != null ? ariaExpanded : (_props$accessibilityS4 = props.accessibilityState) == null ? void 0 : _props$accessibilityS4.expanded,
    selected: ariaSelected != null ? ariaSelected : (_props$accessibilityS5 = props.accessibilityState) == null ? void 0 : _props$accessibilityS5.selected
  };
  var accessibilityLabel = (_props$ariaLabel = props['aria-label']) != null ? _props$ariaLabel : props.accessibilityLabel;
  return (0, _jsxRuntime.jsx)(_ImageAnalyticsTagContext.default.Consumer, {
    children: function children(analyticTag) {
      return (0, _jsxRuntime.jsx)(_ImageViewNativeComponent.default, Object.assign({
        accessibilityState: _accessibilityState
      }, restProps, {
        accessible: props.alt !== undefined ? true : props.accessible,
        accessibilityLabel: accessibilityLabel != null ? accessibilityLabel : props.alt,
        ref: forwardedRef,
        style: style,
        resizeMode: resizeMode,
        tintColor: tintColor,
        source: sources,
        internal_analyticTag: analyticTag
      }));
    }
  });
};
var ImageForwardRef = React.forwardRef(BaseImage);
var Image = ImageForwardRef;
if (_ImageInjection.default.unstable_createImageComponent != null) {
  Image = _ImageInjection.default.unstable_createImageComponent(Image);
}
Image.displayName = 'Image';
Image.getSize = getSize;
Image.getSizeWithHeaders = getSizeWithHeaders;
Image.prefetch = prefetch;
Image.prefetchWithMetadata = prefetchWithMetadata;
Image.queryCache = queryCache;
Image.resolveAssetSource = _resolveAssetSource.default;
Image.propTypes = require('deprecated-react-native-prop-types').ImagePropTypes;
var styles = _StyleSheet.default.create({
  base: {
    overflow: 'hidden'
  }
});
module.exports = Image;
//# sourceMappingURL=Image.ios.js.map