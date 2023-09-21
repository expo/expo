'use strict';

var PropTypes = require('prop-types');
var DeprecatedEdgeInsetsPropType = PropTypes.shape({
  bottom: PropTypes.number,
  left: PropTypes.number,
  right: PropTypes.number,
  top: PropTypes.number
});
module.exports = DeprecatedEdgeInsetsPropType;