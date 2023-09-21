'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _PooledClass = _interopRequireDefault(require("./PooledClass"));
var twoArgumentPooler = _PooledClass.default.twoArgumentPooler;
function Position(left, top) {
  this.left = left;
  this.top = top;
}
Position.prototype.destructor = function () {
  this.left = null;
  this.top = null;
};
_PooledClass.default.addPoolingTo(Position, twoArgumentPooler);
module.exports = Position;