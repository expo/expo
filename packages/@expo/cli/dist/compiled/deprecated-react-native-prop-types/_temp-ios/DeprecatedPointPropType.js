'use strict';

var PropTypes = require('prop-types');
var PointPropType = PropTypes.shape({
  x: PropTypes.number,
  y: PropTypes.number
});
module.exports = PointPropType;