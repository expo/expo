var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPermissionHook = createPermissionHook;
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _react = require("react");
var _excluded = ["get", "request"];
function usePermission(methods, options) {
  var isMounted = (0, _react.useRef)(true);
  var _useState = (0, _react.useState)(null),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    status = _useState2[0],
    setStatus = _useState2[1];
  var _ref = options || {},
    _ref$get = _ref.get,
    get = _ref$get === void 0 ? true : _ref$get,
    _ref$request = _ref.request,
    request = _ref$request === void 0 ? false : _ref$request,
    permissionOptions = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var getPermission = (0, _react.useCallback)((0, _asyncToGenerator2.default)(function* () {
    var response = yield methods.getMethod(Object.keys(permissionOptions).length > 0 ? permissionOptions : undefined);
    if (isMounted.current) setStatus(response);
    return response;
  }), [methods.getMethod]);
  var requestPermission = (0, _react.useCallback)((0, _asyncToGenerator2.default)(function* () {
    var response = yield methods.requestMethod(Object.keys(permissionOptions).length > 0 ? permissionOptions : undefined);
    if (isMounted.current) setStatus(response);
    return response;
  }), [methods.requestMethod]);
  (0, _react.useEffect)(function runMethods() {
    if (request) requestPermission();
    if (!request && get) getPermission();
  }, [get, request, requestPermission, getPermission]);
  (0, _react.useEffect)(function didMount() {
    isMounted.current = true;
    return function () {
      isMounted.current = false;
    };
  }, []);
  return [status, requestPermission, getPermission];
}
function createPermissionHook(methods) {
  return function (options) {
    return usePermission(methods, options);
  };
}