'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getImageSourcesFromImageProps = getImageSourcesFromImageProps;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _resolveAssetSource = _interopRequireDefault(require("./resolveAssetSource"));
function getImageSourcesFromImageProps(imageProps) {
  var source = (0, _resolveAssetSource.default)(imageProps.source);
  var sources;
  var crossOrigin = imageProps.crossOrigin,
    referrerPolicy = imageProps.referrerPolicy,
    src = imageProps.src,
    srcSet = imageProps.srcSet,
    width = imageProps.width,
    height = imageProps.height;
  var headers = {};
  if (crossOrigin === 'use-credentials') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  if (referrerPolicy != null) {
    headers['Referrer-Policy'] = referrerPolicy;
  }
  if (srcSet != null) {
    var sourceList = [];
    var srcSetList = srcSet.split(', ');
    var shouldUseSrcForDefaultScale = true;
    srcSetList.forEach(function (imageSrc) {
      var _imageSrc$split = imageSrc.split(' '),
        _imageSrc$split2 = (0, _slicedToArray2.default)(_imageSrc$split, 2),
        uri = _imageSrc$split2[0],
        _imageSrc$split2$ = _imageSrc$split2[1],
        xScale = _imageSrc$split2$ === void 0 ? '1x' : _imageSrc$split2$;
      if (!xScale.endsWith('x')) {
        console.warn('The provided format for scale is not supported yet. Please use scales like 1x, 2x, etc.');
      } else {
        var scale = parseInt(xScale.split('x')[0], 10);
        if (!isNaN(scale)) {
          shouldUseSrcForDefaultScale = scale === 1 ? false : shouldUseSrcForDefaultScale;
          sourceList.push({
            headers: headers,
            scale: scale,
            uri: uri,
            width: width,
            height: height
          });
        }
      }
    });
    if (shouldUseSrcForDefaultScale && src != null) {
      sourceList.push({
        headers: headers,
        scale: 1,
        uri: src,
        width: width,
        height: height
      });
    }
    if (sourceList.length === 0) {
      console.warn('The provided value for srcSet is not valid.');
    }
    sources = sourceList;
  } else if (src != null) {
    sources = [{
      uri: src,
      headers: headers,
      width: width,
      height: height
    }];
  } else {
    sources = source;
  }
  return sources;
}