'use strict';

var PropTypes = require('prop-types');
var DeprecatedTransformPropTypes = {
  transform: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.shape({
    perspective: PropTypes.number
  }), PropTypes.shape({
    rotate: PropTypes.string
  }), PropTypes.shape({
    rotateX: PropTypes.string
  }), PropTypes.shape({
    rotateY: PropTypes.string
  }), PropTypes.shape({
    rotateZ: PropTypes.string
  }), PropTypes.shape({
    scale: PropTypes.number
  }), PropTypes.shape({
    scaleX: PropTypes.number
  }), PropTypes.shape({
    scaleY: PropTypes.number
  }), PropTypes.shape({
    skewX: PropTypes.string
  }), PropTypes.shape({
    skewY: PropTypes.string
  }), PropTypes.shape({
    translateX: PropTypes.number
  }), PropTypes.shape({
    translateY: PropTypes.number
  })]))
};
module.exports = DeprecatedTransformPropTypes;