'use strict';

var PropTypes = require('prop-types');
var ImageURISourcePropType = PropTypes.shape({
  body: PropTypes.string,
  bundle: PropTypes.string,
  cache: PropTypes.oneOf(['default', 'force-cache', 'only-if-cached', 'reload']),
  headers: PropTypes.objectOf(PropTypes.string),
  height: PropTypes.number,
  method: PropTypes.string,
  scale: PropTypes.number,
  uri: PropTypes.string,
  width: PropTypes.number
});
var ImageSourcePropType = PropTypes.oneOfType([ImageURISourcePropType, PropTypes.number, PropTypes.arrayOf(ImageURISourcePropType)]);
module.exports = ImageSourcePropType;