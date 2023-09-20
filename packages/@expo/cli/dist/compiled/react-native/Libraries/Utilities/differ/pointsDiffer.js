'use strict';

var dummyPoint = {
  x: undefined,
  y: undefined
};
var pointsDiffer = function pointsDiffer(one, two) {
  one = one || dummyPoint;
  two = two || dummyPoint;
  return one !== two && (one.x !== two.x || one.y !== two.y);
};
module.exports = pointsDiffer;
//# sourceMappingURL=pointsDiffer.js.map