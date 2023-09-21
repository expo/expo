var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
function processDecelerationRate(decelerationRate) {
  if (decelerationRate === 'normal') {
    return _Platform.default.select({
      ios: 0.998,
      android: 0.985
    });
  } else if (decelerationRate === 'fast') {
    return _Platform.default.select({
      ios: 0.99,
      android: 0.9
    });
  }
  return decelerationRate;
}
module.exports = processDecelerationRate;