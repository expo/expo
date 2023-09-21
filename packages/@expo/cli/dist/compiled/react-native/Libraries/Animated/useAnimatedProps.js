'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useAnimatedProps;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _ReactFabricPublicInstanceUtils = require("../Renderer/public/ReactFabricPublicInstanceUtils");
var _useRefEffect = _interopRequireDefault(require("../Utilities/useRefEffect"));
var _AnimatedEvent = require("./AnimatedEvent");
var _NativeAnimatedHelper = _interopRequireDefault(require("./NativeAnimatedHelper"));
var _AnimatedProps = _interopRequireDefault(require("./nodes/AnimatedProps"));
var _react = require("react");
function useAnimatedProps(props) {
  var _useReducer = (0, _react.useReducer)(function (count) {
      return count + 1;
    }, 0),
    _useReducer2 = (0, _slicedToArray2.default)(_useReducer, 2),
    scheduleUpdate = _useReducer2[1];
  var onUpdateRef = (0, _react.useRef)(null);
  var node = (0, _react.useMemo)(function () {
    return new _AnimatedProps.default(props, function () {
      return onUpdateRef.current == null ? void 0 : onUpdateRef.current();
    });
  }, [props]);
  useAnimatedPropsLifecycle(node);
  var refEffect = (0, _react.useCallback)(function (instance) {
    node.setNativeView(instance);
    onUpdateRef.current = function () {
      if (process.env.NODE_ENV === 'test' || typeof instance !== 'object' || typeof (instance == null ? void 0 : instance.setNativeProps) !== 'function' || isFabricInstance(instance)) {
        scheduleUpdate();
      } else if (!node.__isNative) {
        instance.setNativeProps(node.__getAnimatedValue());
      } else {
        throw new Error('Attempting to run JS driven animation on animated node ' + 'that has been moved to "native" earlier by starting an ' + 'animation with `useNativeDriver: true`');
      }
    };
    var target = getEventTarget(instance);
    var events = [];
    for (var propName in props) {
      var propValue = props[propName];
      if (propValue instanceof _AnimatedEvent.AnimatedEvent && propValue.__isNative) {
        propValue.__attach(target, propName);
        events.push([propName, propValue]);
      }
    }
    return function () {
      onUpdateRef.current = null;
      for (var _ref of events) {
        var _ref2 = (0, _slicedToArray2.default)(_ref, 2);
        var _propName = _ref2[0];
        var _propValue = _ref2[1];
        _propValue.__detach(target, _propName);
      }
    };
  }, [props, node]);
  var callbackRef = (0, _useRefEffect.default)(refEffect);
  return [reduceAnimatedProps(node), callbackRef];
}
function reduceAnimatedProps(node) {
  return Object.assign({}, node.__getValue(), {
    collapsable: false
  });
}
function useAnimatedPropsLifecycle(node) {
  var prevNodeRef = (0, _react.useRef)(null);
  var isUnmountingRef = (0, _react.useRef)(false);
  (0, _react.useEffect)(function () {
    _NativeAnimatedHelper.default.API.flushQueue();
  });
  (0, _react.useLayoutEffect)(function () {
    isUnmountingRef.current = false;
    return function () {
      isUnmountingRef.current = true;
    };
  }, []);
  (0, _react.useLayoutEffect)(function () {
    node.__attach();
    if (prevNodeRef.current != null) {
      var prevNode = prevNodeRef.current;
      prevNode.__restoreDefaultValues();
      prevNode.__detach();
      prevNodeRef.current = null;
    }
    return function () {
      if (isUnmountingRef.current) {
        node.__detach();
      } else {
        prevNodeRef.current = node;
      }
    };
  }, [node]);
}
function getEventTarget(instance) {
  return typeof instance === 'object' && typeof (instance == null ? void 0 : instance.getScrollableNode) === 'function' ? instance.getScrollableNode() : instance;
}
function isFabricInstance(instance) {
  var _instance$getScrollRe;
  return (0, _ReactFabricPublicInstanceUtils.isPublicInstance)(instance) || (0, _ReactFabricPublicInstanceUtils.isPublicInstance)(instance == null ? void 0 : instance.getNativeScrollRef == null ? void 0 : instance.getNativeScrollRef()) || (0, _ReactFabricPublicInstanceUtils.isPublicInstance)(instance == null ? void 0 : instance.getScrollResponder == null ? void 0 : (_instance$getScrollRe = instance.getScrollResponder()) == null ? void 0 : _instance$getScrollRe.getNativeScrollRef == null ? void 0 : _instance$getScrollRe.getNativeScrollRef());
}