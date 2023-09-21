var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useSyncState;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var UNINTIALIZED_STATE = {};
function useSyncState(initialState) {
  var stateRef = React.useRef(UNINTIALIZED_STATE);
  var isSchedulingRef = React.useRef(false);
  var isMountedRef = React.useRef(true);
  React.useEffect(function () {
    isMountedRef.current = true;
    return function () {
      isMountedRef.current = false;
    };
  }, []);
  if (stateRef.current === UNINTIALIZED_STATE) {
    stateRef.current = typeof initialState === 'function' ? initialState() : initialState;
  }
  var _React$useState = React.useState(stateRef.current),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    trackingState = _React$useState2[0],
    setTrackingState = _React$useState2[1];
  var getState = React.useCallback(function () {
    return stateRef.current;
  }, []);
  var setState = React.useCallback(function (state) {
    if (state === stateRef.current || !isMountedRef.current) {
      return;
    }
    stateRef.current = state;
    if (!isSchedulingRef.current) {
      setTrackingState(state);
    }
  }, []);
  var scheduleUpdate = React.useCallback(function (callback) {
    isSchedulingRef.current = true;
    try {
      callback();
    } finally {
      isSchedulingRef.current = false;
    }
  }, []);
  var flushUpdates = React.useCallback(function () {
    if (!isMountedRef.current) {
      return;
    }
    setTrackingState(stateRef.current);
  }, []);
  if (trackingState !== stateRef.current) {
    setTrackingState(stateRef.current);
  }
  var state = stateRef.current;
  React.useDebugValue(state);
  return [state, getState, setState, scheduleUpdate, flushUpdates];
}