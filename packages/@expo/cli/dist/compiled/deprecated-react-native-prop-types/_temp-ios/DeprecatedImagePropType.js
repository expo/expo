'use strict';

var DeprecatedColorPropType = require('./DeprecatedColorPropType');
var DeprecatedEdgeInsetsPropType = require('./DeprecatedEdgeInsetsPropType');
var DeprecatedImageSourcePropType = require('./DeprecatedImageSourcePropType');
var DeprecatedImageStylePropTypes = require('./DeprecatedImageStylePropTypes');
var DeprecatedStyleSheetPropType = require('./DeprecatedStyleSheetPropType');
var DeprecatedViewPropTypes = require('./DeprecatedViewPropTypes');
var PropTypes = require('prop-types');
var DeprecatedImagePropType = Object.assign({}, DeprecatedViewPropTypes, {
  alt: PropTypes.string,
  blurRadius: PropTypes.number,
  capInsets: DeprecatedEdgeInsetsPropType,
  crossOrigin: PropTypes.oneOf(['anonymous', 'use-credentials']),
  defaultSource: DeprecatedImageSourcePropType,
  fadeDuration: PropTypes.number,
  height: PropTypes.number,
  internal_analyticTag: PropTypes.string,
  loadingIndicatorSource: PropTypes.oneOfType([PropTypes.shape({
    uri: PropTypes.string
  }), PropTypes.number]),
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadEnd: PropTypes.func,
  onLoadStart: PropTypes.func,
  onPartialLoad: PropTypes.func,
  onProgress: PropTypes.func,
  progressiveRenderingEnabled: PropTypes.bool,
  referrerPolicy: PropTypes.oneOf(['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url']),
  resizeMethod: PropTypes.oneOf(['auto', 'resize', 'scale']),
  resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch', 'repeat', 'center']),
  source: DeprecatedImageSourcePropType,
  src: PropTypes.string,
  srcSet: PropTypes.string,
  style: DeprecatedStyleSheetPropType(DeprecatedImageStylePropTypes),
  testID: PropTypes.string,
  tintColor: DeprecatedColorPropType,
  width: PropTypes.number
});
module.exports = DeprecatedImagePropType;