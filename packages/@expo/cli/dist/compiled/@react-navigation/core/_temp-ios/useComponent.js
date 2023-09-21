Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useComponent;
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var NavigationContent = function NavigationContent(_ref) {
  var render = _ref.render,
    children = _ref.children;
  return render(children);
};
function useComponent(render) {
  var renderRef = React.useRef(render);
  renderRef.current = render;
  React.useEffect(function () {
    renderRef.current = null;
  });
  return React.useRef(function (_ref2) {
    var children = _ref2.children;
    var render = renderRef.current;
    if (render === null) {
      throw new Error('The returned component must be rendered in the same render phase as the hook.');
    }
    return (0, _jsxRuntime.jsx)(NavigationContent, {
      render: render,
      children: children
    });
  }).current;
}