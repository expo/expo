var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SafeAreaView = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var React = _interopRequireWildcard(require("react"));
var _NativeSafeAreaView = _interopRequireDefault(require("./specs/NativeSafeAreaView"));
var _excluded = ["edges"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var defaultEdges = {
  top: 'additive',
  left: 'additive',
  bottom: 'additive',
  right: 'additive'
};
var SafeAreaView = React.forwardRef(function (_ref, ref) {
  var edges = _ref.edges,
    props = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var nativeEdges = (0, React.useMemo)(function () {
    var _edgesObj$top, _edgesObj$right, _edgesObj$bottom, _edgesObj$left;
    if (edges == null) {
      return defaultEdges;
    }
    var edgesObj = Array.isArray(edges) ? edges.reduce(function (acc, edge) {
      acc[edge] = 'additive';
      return acc;
    }, {}) : edges;
    var requiredEdges = {
      top: (_edgesObj$top = edgesObj.top) != null ? _edgesObj$top : 'off',
      right: (_edgesObj$right = edgesObj.right) != null ? _edgesObj$right : 'off',
      bottom: (_edgesObj$bottom = edgesObj.bottom) != null ? _edgesObj$bottom : 'off',
      left: (_edgesObj$left = edgesObj.left) != null ? _edgesObj$left : 'off'
    };
    return requiredEdges;
  }, [edges]);
  return React.createElement(_NativeSafeAreaView.default, _extends({}, props, {
    edges: nativeEdges,
    ref: ref
  }));
});
exports.SafeAreaView = SafeAreaView;