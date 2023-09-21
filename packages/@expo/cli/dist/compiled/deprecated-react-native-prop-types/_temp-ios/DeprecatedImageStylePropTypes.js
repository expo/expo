'use strict';

var DeprecatedColorPropType = require('./DeprecatedColorPropType');
var DeprecatedLayoutPropTypes = require('./DeprecatedLayoutPropTypes');
var DeprecatedShadowPropTypesIOS = require('./DeprecatedShadowPropTypesIOS');
var DeprecatedTransformPropTypes = require('./DeprecatedTransformPropTypes');
var PropTypes = require('prop-types');
var DeprecatedImageStylePropTypes = Object.assign({}, DeprecatedLayoutPropTypes, DeprecatedShadowPropTypesIOS, DeprecatedTransformPropTypes, {
  backfaceVisibility: PropTypes.oneOf(['hidden', 'visible']),
  backgroundColor: DeprecatedColorPropType,
  borderBottomLeftRadius: PropTypes.number,
  borderBottomRightRadius: PropTypes.number,
  borderColor: DeprecatedColorPropType,
  borderRadius: PropTypes.number,
  borderTopLeftRadius: PropTypes.number,
  borderTopRightRadius: PropTypes.number,
  borderWidth: PropTypes.number,
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'scale-down']),
  opacity: PropTypes.number,
  overflow: PropTypes.oneOf(['hidden', 'visible']),
  overlayColor: PropTypes.string,
  tintColor: DeprecatedColorPropType,
  resizeMode: PropTypes.oneOf(['center', 'contain', 'cover', 'repeat', 'stretch'])
});
module.exports = DeprecatedImageStylePropTypes;