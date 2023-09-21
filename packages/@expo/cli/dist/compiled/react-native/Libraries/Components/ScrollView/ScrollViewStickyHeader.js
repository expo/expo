var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _Animated = _interopRequireDefault(require("../../Animated/Animated"));
var _ReactFabricPublicInstanceUtils = require("../../Renderer/public/ReactFabricPublicInstanceUtils");
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _useMergeRefs = _interopRequireDefault(require("../../Utilities/useMergeRefs"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var ScrollViewStickyHeaderWithForwardedRef = React.forwardRef(function ScrollViewStickyHeader(props, forwardedRef) {
  var inverted = props.inverted,
    scrollViewHeight = props.scrollViewHeight,
    hiddenOnScroll = props.hiddenOnScroll,
    scrollAnimatedValue = props.scrollAnimatedValue,
    _nextHeaderLayoutY = props.nextHeaderLayoutY;
  var _useState = (0, React.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    measured = _useState2[0],
    setMeasured = _useState2[1];
  var _useState3 = (0, React.useState)(0),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    layoutY = _useState4[0],
    setLayoutY = _useState4[1];
  var _useState5 = (0, React.useState)(0),
    _useState6 = (0, _slicedToArray2.default)(_useState5, 2),
    layoutHeight = _useState6[0],
    setLayoutHeight = _useState6[1];
  var _useState7 = (0, React.useState)(null),
    _useState8 = (0, _slicedToArray2.default)(_useState7, 2),
    translateY = _useState8[0],
    setTranslateY = _useState8[1];
  var _useState9 = (0, React.useState)(_nextHeaderLayoutY),
    _useState10 = (0, _slicedToArray2.default)(_useState9, 2),
    nextHeaderLayoutY = _useState10[0],
    setNextHeaderLayoutY = _useState10[1];
  var _useState11 = (0, React.useState)(false),
    _useState12 = (0, _slicedToArray2.default)(_useState11, 2),
    isFabric = _useState12[0],
    setIsFabric = _useState12[1];
  var callbackRef = function callbackRef(ref) {
    if (ref == null) {
      return;
    }
    ref.setNextHeaderY = function (value) {
      setNextHeaderLayoutY(value);
    };
    setIsFabric((0, _ReactFabricPublicInstanceUtils.isPublicInstance)(ref));
  };
  var ref = (0, _useMergeRefs.default)(callbackRef, forwardedRef);
  var offset = (0, React.useMemo)(function () {
    return hiddenOnScroll === true ? _Animated.default.diffClamp(scrollAnimatedValue.interpolate({
      extrapolateLeft: 'clamp',
      inputRange: [layoutY, layoutY + 1],
      outputRange: [0, 1]
    }).interpolate({
      inputRange: [0, 1],
      outputRange: [0, -1]
    }), -layoutHeight, 0) : null;
  }, [scrollAnimatedValue, layoutHeight, layoutY, hiddenOnScroll]);
  var _useState13 = (0, React.useState)(function () {
      var inputRange = [-1, 0];
      var outputRange = [0, 0];
      var initialTranslateY = scrollAnimatedValue.interpolate({
        inputRange: inputRange,
        outputRange: outputRange
      });
      if (offset != null) {
        return _Animated.default.add(initialTranslateY, offset);
      }
      return initialTranslateY;
    }),
    _useState14 = (0, _slicedToArray2.default)(_useState13, 2),
    animatedTranslateY = _useState14[0],
    setAnimatedTranslateY = _useState14[1];
  var _haveReceivedInitialZeroTranslateY = (0, React.useRef)(true);
  var _timer = (0, React.useRef)(null);
  (0, React.useEffect)(function () {
    if (translateY !== 0 && translateY != null) {
      _haveReceivedInitialZeroTranslateY.current = false;
    }
  }, [translateY]);
  var animatedValueListener = (0, React.useCallback)(function (_ref) {
    var value = _ref.value;
    var _debounceTimeout = _Platform.default.OS === 'android' ? 15 : 64;
    if (value === 0 && !_haveReceivedInitialZeroTranslateY.current) {
      _haveReceivedInitialZeroTranslateY.current = true;
      return;
    }
    if (_timer.current != null) {
      clearTimeout(_timer.current);
    }
    _timer.current = setTimeout(function () {
      if (value !== translateY) {
        setTranslateY(value);
      }
    }, _debounceTimeout);
  }, [translateY]);
  (0, React.useEffect)(function () {
    var inputRange = [-1, 0];
    var outputRange = [0, 0];
    if (measured) {
      if (inverted === true) {
        if (scrollViewHeight != null) {
          var stickStartPoint = layoutY + layoutHeight - scrollViewHeight;
          if (stickStartPoint > 0) {
            inputRange.push(stickStartPoint);
            outputRange.push(0);
            inputRange.push(stickStartPoint + 1);
            outputRange.push(1);
            var collisionPoint = (nextHeaderLayoutY || 0) - layoutHeight - scrollViewHeight;
            if (collisionPoint > stickStartPoint) {
              inputRange.push(collisionPoint, collisionPoint + 1);
              outputRange.push(collisionPoint - stickStartPoint, collisionPoint - stickStartPoint);
            }
          }
        }
      } else {
        inputRange.push(layoutY);
        outputRange.push(0);
        var _collisionPoint = (nextHeaderLayoutY || 0) - layoutHeight;
        if (_collisionPoint >= layoutY) {
          inputRange.push(_collisionPoint, _collisionPoint + 1);
          outputRange.push(_collisionPoint - layoutY, _collisionPoint - layoutY);
        } else {
          inputRange.push(layoutY + 1);
          outputRange.push(1);
        }
      }
    }
    var newAnimatedTranslateY = scrollAnimatedValue.interpolate({
      inputRange: inputRange,
      outputRange: outputRange
    });
    if (offset != null) {
      newAnimatedTranslateY = _Animated.default.add(newAnimatedTranslateY, offset);
    }
    var animatedListenerId;
    if (isFabric) {
      animatedListenerId = newAnimatedTranslateY.addListener(animatedValueListener);
    }
    setAnimatedTranslateY(newAnimatedTranslateY);
    return function () {
      if (animatedListenerId) {
        newAnimatedTranslateY.removeListener(animatedListenerId);
      }
      if (_timer.current != null) {
        clearTimeout(_timer.current);
      }
    };
  }, [nextHeaderLayoutY, measured, layoutHeight, layoutY, scrollViewHeight, scrollAnimatedValue, inverted, offset, animatedValueListener, isFabric]);
  var _onLayout = function _onLayout(event) {
    setLayoutY(event.nativeEvent.layout.y);
    setLayoutHeight(event.nativeEvent.layout.height);
    setMeasured(true);
    props.onLayout(event);
    var child = React.Children.only(props.children);
    if (child.props.onLayout) {
      child.props.onLayout(event);
    }
  };
  var child = React.Children.only(props.children);
  var passthroughAnimatedPropExplicitValues = isFabric && translateY != null ? {
    style: {
      transform: [{
        translateY: translateY
      }]
    }
  } : null;
  return (0, _jsxRuntime.jsx)(_Animated.default.View, {
    collapsable: false,
    nativeID: props.nativeID,
    onLayout: _onLayout,
    ref: ref,
    style: [child.props.style, styles.header, {
      transform: [{
        translateY: animatedTranslateY
      }]
    }],
    passthroughAnimatedPropExplicitValues: passthroughAnimatedPropExplicitValues,
    children: React.cloneElement(child, {
      style: styles.fill,
      onLayout: undefined
    })
  });
});
var styles = _StyleSheet.default.create({
  header: {
    zIndex: 10,
    position: 'relative'
  },
  fill: {
    flex: 1
  }
});
var _default = ScrollViewStickyHeaderWithForwardedRef;
exports.default = _default;