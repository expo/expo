var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validatePathConfig;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var formatToList = function formatToList(items) {
  return items.map(function (key) {
    return `- ${key}`;
  }).join('\n');
};
function validatePathConfig(config) {
  var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var validKeys = ['initialRouteName', 'screens'];
  if (!root) {
    validKeys.push('path', 'exact', 'stringify', 'parse');
  }
  var invalidKeys = Object.keys(config).filter(function (key) {
    return !validKeys.includes(key);
  });
  if (invalidKeys.length) {
    throw new Error(`Found invalid properties in the configuration:\n${formatToList(invalidKeys)}\n\nDid you forget to specify them under a 'screens' property?\n\nYou can only specify the following properties:\n${formatToList(validKeys)}\n\nSee https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration.`);
  }
  if (config.screens) {
    Object.entries(config.screens).forEach(function (_ref) {
      var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
        _ = _ref2[0],
        value = _ref2[1];
      if (typeof value !== 'string') {
        validatePathConfig(value, false);
      }
    });
  }
}