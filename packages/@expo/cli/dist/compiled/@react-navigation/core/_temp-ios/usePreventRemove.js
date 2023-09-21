var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = usePreventRemove;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _nonSecure = require("nanoid/non-secure");
var React = _interopRequireWildcard(require("react"));
var _useLatestCallback = _interopRequireDefault(require("use-latest-callback"));
var _useNavigation = _interopRequireDefault(require("./useNavigation"));
var _usePreventRemoveContext = _interopRequireDefault(require("./usePreventRemoveContext"));
var _useRoute2 = _interopRequireDefault(require("./useRoute"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function usePreventRemove(preventRemove, callback) {
  var _React$useState = React.useState(function () {
      return (0, _nonSecure.nanoid)();
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
    id = _React$useState2[0];
  var navigation = (0, _useNavigation.default)();
  var _useRoute = (0, _useRoute2.default)(),
    routeKey = _useRoute.key;
  var _usePreventRemoveCont = (0, _usePreventRemoveContext.default)(),
    setPreventRemove = _usePreventRemoveCont.setPreventRemove;
  React.useEffect(function () {
    setPreventRemove(id, routeKey, preventRemove);
    return function () {
      setPreventRemove(id, routeKey, false);
    };
  }, [setPreventRemove, id, routeKey, preventRemove]);
  var beforeRemoveListener = (0, _useLatestCallback.default)(function (e) {
    if (!preventRemove) {
      return;
    }
    e.preventDefault();
    callback({
      data: e.data
    });
  });
  React.useEffect(function () {
    return navigation == null ? void 0 : navigation.addListener('beforeRemove', beforeRemoveListener);
  }, [navigation, beforeRemoveListener]);
}