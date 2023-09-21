Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useChildListeners;
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useChildListeners() {
  var _React$useRef = React.useRef({
      action: [],
      focus: []
    }),
    listeners = _React$useRef.current;
  var addListener = React.useCallback(function (type, listener) {
    listeners[type].push(listener);
    var removed = false;
    return function () {
      var index = listeners[type].indexOf(listener);
      if (!removed && index > -1) {
        removed = true;
        listeners[type].splice(index, 1);
      }
    };
  }, [listeners]);
  return {
    listeners: listeners,
    addListener: addListener
  };
}