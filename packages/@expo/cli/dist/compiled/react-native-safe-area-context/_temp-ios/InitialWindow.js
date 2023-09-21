var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialWindowSafeAreaInsets = exports.initialWindowMetrics = void 0;
var _NativeSafeAreaContext = _interopRequireDefault(require("./specs/NativeSafeAreaContext"));
var _ref;
var _NativeSafeAreaContex, _NativeSafeAreaContex2;
var initialWindowMetrics = (_ref = _NativeSafeAreaContext.default === null || _NativeSafeAreaContext.default === void 0 ? void 0 : (_NativeSafeAreaContex = _NativeSafeAreaContext.default.getConstants) === null || _NativeSafeAreaContex === void 0 ? void 0 : (_NativeSafeAreaContex2 = _NativeSafeAreaContex.call(_NativeSafeAreaContext.default)) === null || _NativeSafeAreaContex2 === void 0 ? void 0 : _NativeSafeAreaContex2.initialWindowMetrics) != null ? _ref : null;
exports.initialWindowMetrics = initialWindowMetrics;
var initialWindowSafeAreaInsets = initialWindowMetrics === null || initialWindowMetrics === void 0 ? void 0 : initialWindowMetrics.insets;
exports.initialWindowSafeAreaInsets = initialWindowSafeAreaInsets;