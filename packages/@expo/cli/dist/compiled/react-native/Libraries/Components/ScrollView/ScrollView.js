var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _AnimatedImplementation = _interopRequireDefault(require("../../Animated/AnimatedImplementation"));
var _FrameRateLogger = _interopRequireDefault(require("../../Interaction/FrameRateLogger"));
var _RendererProxy = require("../../ReactNative/RendererProxy");
var _UIManager = _interopRequireDefault(require("../../ReactNative/UIManager"));
var _flattenStyle = _interopRequireDefault(require("../../StyleSheet/flattenStyle"));
var _splitLayoutProps2 = _interopRequireDefault(require("../../StyleSheet/splitLayoutProps"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Dimensions = _interopRequireDefault(require("../../Utilities/Dimensions"));
var _dismissKeyboard = _interopRequireDefault(require("../../Utilities/dismissKeyboard"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _Keyboard = _interopRequireDefault(require("../Keyboard/Keyboard"));
var _TextInputState = _interopRequireDefault(require("../TextInput/TextInputState"));
var _View = _interopRequireDefault(require("../View/View"));
var _AndroidHorizontalScrollContentViewNativeComponent = _interopRequireDefault(require("./AndroidHorizontalScrollContentViewNativeComponent"));
var _AndroidHorizontalScrollViewNativeComponent = _interopRequireDefault(require("./AndroidHorizontalScrollViewNativeComponent"));
var _processDecelerationRate = _interopRequireDefault(require("./processDecelerationRate"));
var _ScrollContentViewNativeComponent = _interopRequireDefault(require("./ScrollContentViewNativeComponent"));
var _ScrollViewCommands = _interopRequireDefault(require("./ScrollViewCommands"));
var _ScrollViewContext = _interopRequireWildcard(require("./ScrollViewContext"));
var _ScrollViewNativeComponent = _interopRequireDefault(require("./ScrollViewNativeComponent"));
var _ScrollViewStickyHeader = _interopRequireDefault(require("./ScrollViewStickyHeader"));
var _invariant = _interopRequireDefault(require("invariant"));
var _memoizeOne = _interopRequireDefault(require("memoize-one"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
if (_Platform.default.OS === 'ios') {
  require('../../Renderer/shims/ReactNative');
}
var _ref = _Platform.default.OS === 'android' ? {
    NativeHorizontalScrollViewTuple: [_AndroidHorizontalScrollViewNativeComponent.default, _AndroidHorizontalScrollContentViewNativeComponent.default],
    NativeVerticalScrollViewTuple: [_ScrollViewNativeComponent.default, _View.default]
  } : {
    NativeHorizontalScrollViewTuple: [_ScrollViewNativeComponent.default, _ScrollContentViewNativeComponent.default],
    NativeVerticalScrollViewTuple: [_ScrollViewNativeComponent.default, _ScrollContentViewNativeComponent.default]
  },
  NativeHorizontalScrollViewTuple = _ref.NativeHorizontalScrollViewTuple,
  NativeVerticalScrollViewTuple = _ref.NativeVerticalScrollViewTuple;
var IS_ANIMATING_TOUCH_START_THRESHOLD_MS = 16;
var ScrollView = function (_React$Component) {
  (0, _inherits2.default)(ScrollView, _React$Component);
  var _super = _createSuper(ScrollView);
  function ScrollView(props) {
    var _this$props$contentOf, _this$props$contentOf2, _this$props$contentIn, _this$props$contentIn2;
    var _this;
    (0, _classCallCheck2.default)(this, ScrollView);
    _this = _super.call(this, props);
    _this._scrollAnimatedValueAttachment = null;
    _this._stickyHeaderRefs = new Map();
    _this._headerLayoutYs = new Map();
    _this._keyboardMetrics = null;
    _this._additionalScrollOffset = 0;
    _this._isTouching = false;
    _this._lastMomentumScrollBeginTime = 0;
    _this._lastMomentumScrollEndTime = 0;
    _this._observedScrollSinceBecomingResponder = false;
    _this._becameResponderWhileAnimating = false;
    _this._preventNegativeScrollOffset = null;
    _this._animated = null;
    _this._subscriptionKeyboardWillShow = null;
    _this._subscriptionKeyboardWillHide = null;
    _this._subscriptionKeyboardDidShow = null;
    _this._subscriptionKeyboardDidHide = null;
    _this.state = {
      layoutHeight: null
    };
    _this.getScrollResponder = function () {
      return (0, _assertThisInitialized2.default)(_this);
    };
    _this.getScrollableNode = function () {
      return (0, _RendererProxy.findNodeHandle)(_this._scrollView.nativeInstance);
    };
    _this.getInnerViewNode = function () {
      return (0, _RendererProxy.findNodeHandle)(_this._innerView.nativeInstance);
    };
    _this.getInnerViewRef = function () {
      return _this._innerView.nativeInstance;
    };
    _this.getNativeScrollRef = function () {
      return _this._scrollView.nativeInstance;
    };
    _this.scrollTo = function (options, deprecatedX, deprecatedAnimated) {
      var x, y, animated;
      if (typeof options === 'number') {
        console.warn('`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, ' + 'animated: true})` instead.');
        y = options;
        x = deprecatedX;
        animated = deprecatedAnimated;
      } else if (options) {
        y = options.y;
        x = options.x;
        animated = options.animated;
      }
      if (_this._scrollView.nativeInstance == null) {
        return;
      }
      _ScrollViewCommands.default.scrollTo(_this._scrollView.nativeInstance, x || 0, y || 0, animated !== false);
    };
    _this.scrollToEnd = function (options) {
      var animated = (options && options.animated) !== false;
      if (_this._scrollView.nativeInstance == null) {
        return;
      }
      _ScrollViewCommands.default.scrollToEnd(_this._scrollView.nativeInstance, animated);
    };
    _this.flashScrollIndicators = function () {
      if (_this._scrollView.nativeInstance == null) {
        return;
      }
      _ScrollViewCommands.default.flashScrollIndicators(_this._scrollView.nativeInstance);
    };
    _this.scrollResponderScrollNativeHandleToKeyboard = function (nodeHandle, additionalOffset, preventNegativeScrollOffset) {
      _this._additionalScrollOffset = additionalOffset || 0;
      _this._preventNegativeScrollOffset = !!preventNegativeScrollOffset;
      if (_this._innerView.nativeInstance == null) {
        return;
      }
      if (typeof nodeHandle === 'number') {
        _UIManager.default.measureLayout(nodeHandle, (0, _nullthrows.default)((0, _RendererProxy.findNodeHandle)((0, _assertThisInitialized2.default)(_this))), _this._textInputFocusError, _this._inputMeasureAndScrollToKeyboard);
      } else {
        nodeHandle.measureLayout(_this._innerView.nativeInstance, _this._inputMeasureAndScrollToKeyboard, _this._textInputFocusError);
      }
    };
    _this.scrollResponderZoomTo = function (rect, animated) {
      (0, _invariant.default)(_Platform.default.OS === 'ios', 'zoomToRect is not implemented');
      if ('animated' in rect) {
        _this._animated = rect.animated;
        delete rect.animated;
      } else if (typeof animated !== 'undefined') {
        console.warn('`scrollResponderZoomTo` `animated` argument is deprecated. Use `options.animated` instead');
      }
      if (_this._scrollView.nativeInstance == null) {
        return;
      }
      _ScrollViewCommands.default.zoomToRect(_this._scrollView.nativeInstance, rect, animated !== false);
    };
    _this._inputMeasureAndScrollToKeyboard = function (left, top, width, height) {
      var keyboardScreenY = _Dimensions.default.get('window').height;
      var scrollTextInputIntoVisibleRect = function scrollTextInputIntoVisibleRect() {
        if (_this._keyboardMetrics != null) {
          keyboardScreenY = _this._keyboardMetrics.screenY;
        }
        var scrollOffsetY = top - keyboardScreenY + height + _this._additionalScrollOffset;
        if (_this._preventNegativeScrollOffset === true) {
          scrollOffsetY = Math.max(0, scrollOffsetY);
        }
        _this.scrollTo({
          x: 0,
          y: scrollOffsetY,
          animated: true
        });
        _this._additionalScrollOffset = 0;
        _this._preventNegativeScrollOffset = false;
      };
      if (_this._keyboardMetrics == null) {
        setTimeout(function () {
          scrollTextInputIntoVisibleRect();
        }, 0);
      } else {
        scrollTextInputIntoVisibleRect();
      }
    };
    _this._handleScroll = function (e) {
      if (__DEV__) {
        if (_this.props.onScroll && _this.props.scrollEventThrottle == null && _Platform.default.OS === 'ios') {
          console.log('You specified `onScroll` on a <ScrollView> but not ' + '`scrollEventThrottle`. You will only receive one event. ' + 'Using `16` you get all the events but be aware that it may ' + "cause frame drops, use a bigger number if you don't need as " + 'much precision.');
        }
      }
      _this._observedScrollSinceBecomingResponder = true;
      _this.props.onScroll && _this.props.onScroll(e);
    };
    _this._handleLayout = function (e) {
      if (_this.props.invertStickyHeaders === true) {
        _this.setState({
          layoutHeight: e.nativeEvent.layout.height
        });
      }
      if (_this.props.onLayout) {
        _this.props.onLayout(e);
      }
    };
    _this._handleContentOnLayout = function (e) {
      var _e$nativeEvent$layout = e.nativeEvent.layout,
        width = _e$nativeEvent$layout.width,
        height = _e$nativeEvent$layout.height;
      _this.props.onContentSizeChange && _this.props.onContentSizeChange(width, height);
    };
    _this._innerView = createRefForwarder(function (instance) {
      return instance;
    });
    _this._scrollView = createRefForwarder(function (nativeInstance) {
      var publicInstance = Object.assign(nativeInstance, {
        getScrollResponder: _this.getScrollResponder,
        getScrollableNode: _this.getScrollableNode,
        getInnerViewNode: _this.getInnerViewNode,
        getInnerViewRef: _this.getInnerViewRef,
        getNativeScrollRef: _this.getNativeScrollRef,
        scrollTo: _this.scrollTo,
        scrollToEnd: _this.scrollToEnd,
        flashScrollIndicators: _this.flashScrollIndicators,
        scrollResponderZoomTo: _this.scrollResponderZoomTo,
        scrollResponderScrollNativeHandleToKeyboard: _this.scrollResponderScrollNativeHandleToKeyboard
      });
      return publicInstance;
    });
    _this.scrollResponderKeyboardWillShow = function (e) {
      _this._keyboardMetrics = e.endCoordinates;
      _this.props.onKeyboardWillShow && _this.props.onKeyboardWillShow(e);
    };
    _this.scrollResponderKeyboardWillHide = function (e) {
      _this._keyboardMetrics = null;
      _this.props.onKeyboardWillHide && _this.props.onKeyboardWillHide(e);
    };
    _this.scrollResponderKeyboardDidShow = function (e) {
      _this._keyboardMetrics = e.endCoordinates;
      _this.props.onKeyboardDidShow && _this.props.onKeyboardDidShow(e);
    };
    _this.scrollResponderKeyboardDidHide = function (e) {
      _this._keyboardMetrics = null;
      _this.props.onKeyboardDidHide && _this.props.onKeyboardDidHide(e);
    };
    _this._handleMomentumScrollBegin = function (e) {
      _this._lastMomentumScrollBeginTime = global.performance.now();
      _this.props.onMomentumScrollBegin && _this.props.onMomentumScrollBegin(e);
    };
    _this._handleMomentumScrollEnd = function (e) {
      _FrameRateLogger.default.endScroll();
      _this._lastMomentumScrollEndTime = global.performance.now();
      _this.props.onMomentumScrollEnd && _this.props.onMomentumScrollEnd(e);
    };
    _this._handleScrollBeginDrag = function (e) {
      _FrameRateLogger.default.beginScroll();
      if (_Platform.default.OS === 'android' && _this.props.keyboardDismissMode === 'on-drag') {
        (0, _dismissKeyboard.default)();
      }
      _this.props.onScrollBeginDrag && _this.props.onScrollBeginDrag(e);
    };
    _this._handleScrollEndDrag = function (e) {
      var velocity = e.nativeEvent.velocity;
      if (!_this._isAnimating() && (!velocity || velocity.x === 0 && velocity.y === 0)) {
        _FrameRateLogger.default.endScroll();
      }
      _this.props.onScrollEndDrag && _this.props.onScrollEndDrag(e);
    };
    _this._isAnimating = function () {
      var now = global.performance.now();
      var timeSinceLastMomentumScrollEnd = now - _this._lastMomentumScrollEndTime;
      var isAnimating = timeSinceLastMomentumScrollEnd < IS_ANIMATING_TOUCH_START_THRESHOLD_MS || _this._lastMomentumScrollEndTime < _this._lastMomentumScrollBeginTime;
      return isAnimating;
    };
    _this._handleResponderGrant = function (e) {
      _this._observedScrollSinceBecomingResponder = false;
      _this.props.onResponderGrant && _this.props.onResponderGrant(e);
      _this._becameResponderWhileAnimating = _this._isAnimating();
    };
    _this._handleResponderReject = function () {};
    _this._handleResponderRelease = function (e) {
      _this._isTouching = e.nativeEvent.touches.length !== 0;
      _this.props.onResponderRelease && _this.props.onResponderRelease(e);
      if (typeof e.target === 'number') {
        if (__DEV__) {
          console.error('Did not expect event target to be a number. Should have been a native component');
        }
        return;
      }
      var currentlyFocusedTextInput = _TextInputState.default.currentlyFocusedInput();
      if (currentlyFocusedTextInput != null && _this.props.keyboardShouldPersistTaps !== true && _this.props.keyboardShouldPersistTaps !== 'always' && _this._keyboardIsDismissible() && e.target !== currentlyFocusedTextInput && !_this._observedScrollSinceBecomingResponder && !_this._becameResponderWhileAnimating) {
        _TextInputState.default.blurTextInput(currentlyFocusedTextInput);
      }
    };
    _this._handleResponderTerminationRequest = function () {
      return !_this._observedScrollSinceBecomingResponder;
    };
    _this._handleScrollShouldSetResponder = function () {
      if (_this.props.disableScrollViewPanResponder === true) {
        return false;
      }
      return _this._isTouching;
    };
    _this._handleStartShouldSetResponder = function (e) {
      if (_this.props.disableScrollViewPanResponder === true) {
        return false;
      }
      var currentlyFocusedInput = _TextInputState.default.currentlyFocusedInput();
      if (_this.props.keyboardShouldPersistTaps === 'handled' && _this._keyboardIsDismissible() && e.target !== currentlyFocusedInput) {
        return true;
      }
      return false;
    };
    _this._handleStartShouldSetResponderCapture = function (e) {
      if (_this._isAnimating()) {
        return true;
      }
      if (_this.props.disableScrollViewPanResponder === true) {
        return false;
      }
      var keyboardShouldPersistTaps = _this.props.keyboardShouldPersistTaps;
      var keyboardNeverPersistTaps = !keyboardShouldPersistTaps || keyboardShouldPersistTaps === 'never';
      if (typeof e.target === 'number') {
        if (__DEV__) {
          console.error('Did not expect event target to be a number. Should have been a native component');
        }
        return false;
      }
      if (_this._softKeyboardIsDetached()) {
        return false;
      }
      if (keyboardNeverPersistTaps && _this._keyboardIsDismissible() && e.target != null && !_TextInputState.default.isTextInput(e.target)) {
        return true;
      }
      return false;
    };
    _this._keyboardIsDismissible = function () {
      var currentlyFocusedInput = _TextInputState.default.currentlyFocusedInput();
      var hasFocusedTextInput = currentlyFocusedInput != null && _TextInputState.default.isTextInput(currentlyFocusedInput);
      var softKeyboardMayBeOpen = _this._keyboardMetrics != null || _this._keyboardEventsAreUnreliable();
      return hasFocusedTextInput && softKeyboardMayBeOpen;
    };
    _this._softKeyboardIsDetached = function () {
      return _this._keyboardMetrics != null && _this._keyboardMetrics.height === 0;
    };
    _this._keyboardEventsAreUnreliable = function () {
      return _Platform.default.OS === 'android' && _Platform.default.Version < 30;
    };
    _this._handleTouchEnd = function (e) {
      var nativeEvent = e.nativeEvent;
      _this._isTouching = nativeEvent.touches.length !== 0;
      var keyboardShouldPersistTaps = _this.props.keyboardShouldPersistTaps;
      var keyboardNeverPersistsTaps = !keyboardShouldPersistTaps || keyboardShouldPersistTaps === 'never';
      var currentlyFocusedTextInput = _TextInputState.default.currentlyFocusedInput();
      if (currentlyFocusedTextInput != null && e.target !== currentlyFocusedTextInput && _this._softKeyboardIsDetached() && _this._keyboardIsDismissible() && keyboardNeverPersistsTaps) {
        _TextInputState.default.blurTextInput(currentlyFocusedTextInput);
      }
      _this.props.onTouchEnd && _this.props.onTouchEnd(e);
    };
    _this._handleTouchCancel = function (e) {
      _this._isTouching = false;
      _this.props.onTouchCancel && _this.props.onTouchCancel(e);
    };
    _this._handleTouchStart = function (e) {
      _this._isTouching = true;
      _this.props.onTouchStart && _this.props.onTouchStart(e);
    };
    _this._handleTouchMove = function (e) {
      _this.props.onTouchMove && _this.props.onTouchMove(e);
    };
    _this._scrollAnimatedValue = new _AnimatedImplementation.default.Value((_this$props$contentOf = (_this$props$contentOf2 = _this.props.contentOffset) == null ? void 0 : _this$props$contentOf2.y) != null ? _this$props$contentOf : 0);
    _this._scrollAnimatedValue.setOffset((_this$props$contentIn = (_this$props$contentIn2 = _this.props.contentInset) == null ? void 0 : _this$props$contentIn2.top) != null ? _this$props$contentIn : 0);
    return _this;
  }
  (0, _createClass2.default)(ScrollView, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (typeof this.props.keyboardShouldPersistTaps === 'boolean') {
        console.warn(`'keyboardShouldPersistTaps={${this.props.keyboardShouldPersistTaps === true ? 'true' : 'false'}}' is deprecated. ` + `Use 'keyboardShouldPersistTaps="${this.props.keyboardShouldPersistTaps ? 'always' : 'never'}"' instead`);
      }
      this._keyboardMetrics = _Keyboard.default.metrics();
      this._additionalScrollOffset = 0;
      this._subscriptionKeyboardWillShow = _Keyboard.default.addListener('keyboardWillShow', this.scrollResponderKeyboardWillShow);
      this._subscriptionKeyboardWillHide = _Keyboard.default.addListener('keyboardWillHide', this.scrollResponderKeyboardWillHide);
      this._subscriptionKeyboardDidShow = _Keyboard.default.addListener('keyboardDidShow', this.scrollResponderKeyboardDidShow);
      this._subscriptionKeyboardDidHide = _Keyboard.default.addListener('keyboardDidHide', this.scrollResponderKeyboardDidHide);
      this._updateAnimatedNodeAttachment();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      var prevContentInsetTop = prevProps.contentInset ? prevProps.contentInset.top : 0;
      var newContentInsetTop = this.props.contentInset ? this.props.contentInset.top : 0;
      if (prevContentInsetTop !== newContentInsetTop) {
        this._scrollAnimatedValue.setOffset(newContentInsetTop || 0);
      }
      this._updateAnimatedNodeAttachment();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this._subscriptionKeyboardWillShow != null) {
        this._subscriptionKeyboardWillShow.remove();
      }
      if (this._subscriptionKeyboardWillHide != null) {
        this._subscriptionKeyboardWillHide.remove();
      }
      if (this._subscriptionKeyboardDidShow != null) {
        this._subscriptionKeyboardDidShow.remove();
      }
      if (this._subscriptionKeyboardDidHide != null) {
        this._subscriptionKeyboardDidHide.remove();
      }
      if (this._scrollAnimatedValueAttachment) {
        this._scrollAnimatedValueAttachment.detach();
      }
    }
  }, {
    key: "_textInputFocusError",
    value: function _textInputFocusError() {
      console.warn('Error measuring text field.');
    }
  }, {
    key: "_getKeyForIndex",
    value: function _getKeyForIndex(index, childArray) {
      var child = childArray[index];
      return child && child.key;
    }
  }, {
    key: "_updateAnimatedNodeAttachment",
    value: function _updateAnimatedNodeAttachment() {
      if (this._scrollAnimatedValueAttachment) {
        this._scrollAnimatedValueAttachment.detach();
      }
      if (this.props.stickyHeaderIndices && this.props.stickyHeaderIndices.length > 0) {
        this._scrollAnimatedValueAttachment = _AnimatedImplementation.default.attachNativeEvent(this._scrollView.nativeInstance, 'onScroll', [{
          nativeEvent: {
            contentOffset: {
              y: this._scrollAnimatedValue
            }
          }
        }]);
      }
    }
  }, {
    key: "_setStickyHeaderRef",
    value: function _setStickyHeaderRef(key, ref) {
      if (ref) {
        this._stickyHeaderRefs.set(key, ref);
      } else {
        this._stickyHeaderRefs.delete(key);
      }
    }
  }, {
    key: "_onStickyHeaderLayout",
    value: function _onStickyHeaderLayout(index, event, key) {
      var stickyHeaderIndices = this.props.stickyHeaderIndices;
      if (!stickyHeaderIndices) {
        return;
      }
      var childArray = React.Children.toArray(this.props.children);
      if (key !== this._getKeyForIndex(index, childArray)) {
        return;
      }
      var layoutY = event.nativeEvent.layout.y;
      this._headerLayoutYs.set(key, layoutY);
      var indexOfIndex = stickyHeaderIndices.indexOf(index);
      var previousHeaderIndex = stickyHeaderIndices[indexOfIndex - 1];
      if (previousHeaderIndex != null) {
        var previousHeader = this._stickyHeaderRefs.get(this._getKeyForIndex(previousHeaderIndex, childArray));
        previousHeader && previousHeader.setNextHeaderY && previousHeader.setNextHeaderY(layoutY);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;
      var _ref2 = this.props.horizontal === true ? NativeHorizontalScrollViewTuple : NativeVerticalScrollViewTuple,
        _ref3 = (0, _slicedToArray2.default)(_ref2, 2),
        NativeDirectionalScrollView = _ref3[0],
        NativeDirectionalScrollContentView = _ref3[1];
      var contentContainerStyle = [this.props.horizontal === true && styles.contentContainerHorizontal, this.props.contentContainerStyle];
      if (__DEV__ && this.props.style !== undefined) {
        var style = (0, _flattenStyle.default)(this.props.style);
        var childLayoutProps = ['alignItems', 'justifyContent'].filter(function (prop) {
          return style && style[prop] !== undefined;
        });
        (0, _invariant.default)(childLayoutProps.length === 0, 'ScrollView child layout (' + JSON.stringify(childLayoutProps) + ') must be applied through the contentContainerStyle prop.');
      }
      var contentSizeChangeProps = this.props.onContentSizeChange == null ? null : {
        onLayout: this._handleContentOnLayout
      };
      var stickyHeaderIndices = this.props.stickyHeaderIndices;
      var children = this.props.children;
      if (stickyHeaderIndices != null && stickyHeaderIndices.length > 0) {
        var childArray = React.Children.toArray(this.props.children);
        children = childArray.map(function (child, index) {
          var indexOfIndex = child ? stickyHeaderIndices.indexOf(index) : -1;
          if (indexOfIndex > -1) {
            var key = child.key;
            var nextIndex = stickyHeaderIndices[indexOfIndex + 1];
            var StickyHeaderComponent = _this2.props.StickyHeaderComponent || _ScrollViewStickyHeader.default;
            return (0, _jsxRuntime.jsx)(StickyHeaderComponent, {
              nativeID: 'StickyHeader-' + key,
              ref: function ref(_ref4) {
                return _this2._setStickyHeaderRef(key, _ref4);
              },
              nextHeaderLayoutY: _this2._headerLayoutYs.get(_this2._getKeyForIndex(nextIndex, childArray)),
              onLayout: function onLayout(event) {
                return _this2._onStickyHeaderLayout(index, event, key);
              },
              scrollAnimatedValue: _this2._scrollAnimatedValue,
              inverted: _this2.props.invertStickyHeaders,
              hiddenOnScroll: _this2.props.stickyHeaderHiddenOnScroll,
              scrollViewHeight: _this2.state.layoutHeight,
              children: child
            }, key);
          } else {
            return child;
          }
        });
      }
      children = (0, _jsxRuntime.jsx)(_ScrollViewContext.default.Provider, {
        value: this.props.horizontal === true ? _ScrollViewContext.HORIZONTAL : _ScrollViewContext.VERTICAL,
        children: children
      });
      var hasStickyHeaders = Array.isArray(stickyHeaderIndices) && stickyHeaderIndices.length > 0;
      var contentContainer = (0, _jsxRuntime.jsx)(NativeDirectionalScrollContentView, Object.assign({}, contentSizeChangeProps, {
        ref: this._innerView.getForwardingRef(this.props.innerViewRef),
        style: contentContainerStyle,
        removeClippedSubviews: _Platform.default.OS === 'android' && hasStickyHeaders ? false : this.props.removeClippedSubviews,
        collapsable: false,
        children: children
      }));
      var alwaysBounceHorizontal = this.props.alwaysBounceHorizontal !== undefined ? this.props.alwaysBounceHorizontal : this.props.horizontal;
      var alwaysBounceVertical = this.props.alwaysBounceVertical !== undefined ? this.props.alwaysBounceVertical : !this.props.horizontal;
      var baseStyle = this.props.horizontal === true ? styles.baseHorizontal : styles.baseVertical;
      var props = Object.assign({}, this.props, {
        alwaysBounceHorizontal: alwaysBounceHorizontal,
        alwaysBounceVertical: alwaysBounceVertical,
        style: _StyleSheet.default.compose(baseStyle, this.props.style),
        onContentSizeChange: null,
        onLayout: this._handleLayout,
        onMomentumScrollBegin: this._handleMomentumScrollBegin,
        onMomentumScrollEnd: this._handleMomentumScrollEnd,
        onResponderGrant: this._handleResponderGrant,
        onResponderReject: this._handleResponderReject,
        onResponderRelease: this._handleResponderRelease,
        onResponderTerminationRequest: this._handleResponderTerminationRequest,
        onScrollBeginDrag: this._handleScrollBeginDrag,
        onScrollEndDrag: this._handleScrollEndDrag,
        onScrollShouldSetResponder: this._handleScrollShouldSetResponder,
        onStartShouldSetResponder: this._handleStartShouldSetResponder,
        onStartShouldSetResponderCapture: this._handleStartShouldSetResponderCapture,
        onTouchEnd: this._handleTouchEnd,
        onTouchMove: this._handleTouchMove,
        onTouchStart: this._handleTouchStart,
        onTouchCancel: this._handleTouchCancel,
        onScroll: this._handleScroll,
        scrollEventThrottle: hasStickyHeaders ? 1 : this.props.scrollEventThrottle,
        sendMomentumEvents: this.props.onMomentumScrollBegin || this.props.onMomentumScrollEnd ? true : false,
        snapToStart: this.props.snapToStart !== false,
        snapToEnd: this.props.snapToEnd !== false,
        pagingEnabled: _Platform.default.select({
          ios: this.props.pagingEnabled === true && this.props.snapToInterval == null && this.props.snapToOffsets == null,
          android: this.props.pagingEnabled === true || this.props.snapToInterval != null || this.props.snapToOffsets != null
        })
      });
      var decelerationRate = this.props.decelerationRate;
      if (decelerationRate != null) {
        props.decelerationRate = (0, _processDecelerationRate.default)(decelerationRate);
      }
      var refreshControl = this.props.refreshControl;
      var scrollViewRef = this._scrollView.getForwardingRef(this.props.scrollViewRef);
      if (refreshControl) {
        if (_Platform.default.OS === 'ios') {
          return (0, _jsxRuntime.jsxs)(NativeDirectionalScrollView, Object.assign({}, props, {
            ref: scrollViewRef,
            children: [refreshControl, contentContainer]
          }));
        } else if (_Platform.default.OS === 'android') {
          var _splitLayoutProps = (0, _splitLayoutProps2.default)((0, _flattenStyle.default)(props.style)),
            outer = _splitLayoutProps.outer,
            inner = _splitLayoutProps.inner;
          return React.cloneElement(refreshControl, {
            style: _StyleSheet.default.compose(baseStyle, outer)
          }, (0, _jsxRuntime.jsx)(NativeDirectionalScrollView, Object.assign({}, props, {
            style: _StyleSheet.default.compose(baseStyle, inner),
            ref: scrollViewRef,
            children: contentContainer
          })));
        }
      }
      return (0, _jsxRuntime.jsx)(NativeDirectionalScrollView, Object.assign({}, props, {
        ref: scrollViewRef,
        children: contentContainer
      }));
    }
  }]);
  return ScrollView;
}(React.Component);
ScrollView.Context = _ScrollViewContext.default;
var styles = _StyleSheet.default.create({
  baseVertical: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    overflow: 'scroll'
  },
  baseHorizontal: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    overflow: 'scroll'
  },
  contentContainerHorizontal: {
    flexDirection: 'row'
  }
});
function createRefForwarder(mutator) {
  var state = {
    getForwardingRef: (0, _memoizeOne.default)(function (forwardedRef) {
      return function (nativeInstance) {
        var publicInstance = nativeInstance == null ? null : mutator(nativeInstance);
        state.nativeInstance = nativeInstance;
        state.publicInstance = publicInstance;
        if (forwardedRef != null) {
          if (typeof forwardedRef === 'function') {
            forwardedRef(publicInstance);
          } else {
            forwardedRef.current = publicInstance;
          }
        }
      };
    }),
    nativeInstance: null,
    publicInstance: null
  };
  return state;
}
function Wrapper(props, ref) {
  return (0, _jsxRuntime.jsx)(ScrollView, Object.assign({}, props, {
    scrollViewRef: ref
  }));
}
Wrapper.displayName = 'ScrollView';
var ForwardedScrollView = React.forwardRef(Wrapper);
ForwardedScrollView.Context = _ScrollViewContext.default;
ForwardedScrollView.displayName = 'ScrollView';
module.exports = ForwardedScrollView;