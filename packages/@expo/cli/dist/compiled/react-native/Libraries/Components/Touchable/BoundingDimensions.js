'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _PooledClass = _interopRequireDefault(require("./PooledClass"));
var twoArgumentPooler = _PooledClass.default.twoArgumentPooler;
function BoundingDimensions(width, height) {
  this.width = width;
  this.height = height;
}
BoundingDimensions.prototype.destructor = function () {
  this.width = null;
  this.height = null;
};
BoundingDimensions.getPooledFromElement = function (element) {
  return BoundingDimensions.getPooled(element.offsetWidth, element.offsetHeight);
};
_PooledClass.default.addPoolingTo(BoundingDimensions, twoArgumentPooler);
module.exports = BoundingDimensions;