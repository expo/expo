'use strict';

var dummySize = {
  width: undefined,
  height: undefined
};
var sizesDiffer = function sizesDiffer(one, two) {
  var defaultedOne = one || dummySize;
  var defaultedTwo = two || dummySize;
  return defaultedOne !== defaultedTwo && (defaultedOne.width !== defaultedTwo.width || defaultedOne.height !== defaultedTwo.height);
};
module.exports = sizesDiffer;