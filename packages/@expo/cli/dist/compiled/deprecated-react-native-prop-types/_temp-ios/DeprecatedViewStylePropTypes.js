'use strict';

var DeprecatedColorPropType = require('./DeprecatedColorPropType');
var DeprecatedLayoutPropTypes = require('./DeprecatedLayoutPropTypes');
var DeprecatedShadowPropTypesIOS = require('./DeprecatedShadowPropTypesIOS');
var DeprecatedTransformPropTypes = require('./DeprecatedTransformPropTypes');
var PropTypes = require('prop-types');
var DeprecatedViewStylePropTypes = Object.assign({}, DeprecatedLayoutPropTypes, DeprecatedShadowPropTypesIOS, DeprecatedTransformPropTypes, {
  backfaceVisibility: PropTypes.oneOf(['hidden', 'visible']),
  backgroundColor: DeprecatedColorPropType,
  borderBottomColor: DeprecatedColorPropType,
  borderBottomEndRadius: PropTypes.number,
  borderBottomLeftRadius: PropTypes.number,
  borderBottomRightRadius: PropTypes.number,
  borderBottomStartRadius: PropTypes.number,
  borderBottomWidth: PropTypes.number,
  borderColor: DeprecatedColorPropType,
  borderCurve: PropTypes.oneOf(['circular', 'continuous']),
  borderEndColor: DeprecatedColorPropType,
  borderEndEndRadius: PropTypes.number,
  borderEndStartRadius: PropTypes.number,
  borderLeftColor: DeprecatedColorPropType,
  borderLeftWidth: PropTypes.number,
  borderRadius: PropTypes.number,
  borderRightColor: DeprecatedColorPropType,
  borderRightWidth: PropTypes.number,
  borderStartColor: DeprecatedColorPropType,
  borderStartEndRadius: PropTypes.number,
  borderStartStartRadius: PropTypes.number,
  borderStyle: PropTypes.oneOf(['dashed', 'dotted', 'solid']),
  borderTopColor: DeprecatedColorPropType,
  borderTopEndRadius: PropTypes.number,
  borderTopLeftRadius: PropTypes.number,
  borderTopRightRadius: PropTypes.number,
  borderTopStartRadius: PropTypes.number,
  borderTopWidth: PropTypes.number,
  borderWidth: PropTypes.number,
  elevation: PropTypes.number,
  opacity: PropTypes.number,
  pointerEvents: PropTypes.oneOf(['auto', 'box-none', 'box-only', 'none'])
});
module.exports = DeprecatedViewStylePropTypes;