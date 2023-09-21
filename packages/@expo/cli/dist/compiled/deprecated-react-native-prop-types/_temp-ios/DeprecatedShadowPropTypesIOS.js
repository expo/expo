'use strict';

var DeprecatedColorPropType = require('./DeprecatedColorPropType');
var PropTypes = require('prop-types');
var DeprecatedShadowPropTypesIOS = {
  shadowColor: DeprecatedColorPropType,
  shadowOffset: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number
  }),
  shadowOpacity: PropTypes.number,
  shadowRadius: PropTypes.number
};
module.exports = DeprecatedShadowPropTypesIOS;