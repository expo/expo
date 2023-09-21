var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _PressabilityDebug = require("../../Pressability/PressabilityDebug");
var _UIManager = _interopRequireDefault(require("../../ReactNative/UIManager"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _SoundManager = _interopRequireDefault(require("../Sound/SoundManager"));
var _BoundingDimensions = _interopRequireDefault(require("./BoundingDimensions"));
var _Position = _interopRequireDefault(require("./Position"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var extractSingleTouch = function extractSingleTouch(nativeEvent) {
  var touches = nativeEvent.touches;
  var changedTouches = nativeEvent.changedTouches;
  var hasTouches = touches && touches.length > 0;
  var hasChangedTouches = changedTouches && changedTouches.length > 0;
  return !hasTouches && hasChangedTouches ? changedTouches[0] : hasTouches ? touches[0] : nativeEvent;
};
var States = {
  NOT_RESPONDER: 'NOT_RESPONDER',
  RESPONDER_INACTIVE_PRESS_IN: 'RESPONDER_INACTIVE_PRESS_IN',
  RESPONDER_INACTIVE_PRESS_OUT: 'RESPONDER_INACTIVE_PRESS_OUT',
  RESPONDER_ACTIVE_PRESS_IN: 'RESPONDER_ACTIVE_PRESS_IN',
  RESPONDER_ACTIVE_PRESS_OUT: 'RESPONDER_ACTIVE_PRESS_OUT',
  RESPONDER_ACTIVE_LONG_PRESS_IN: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
  RESPONDER_ACTIVE_LONG_PRESS_OUT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT',
  ERROR: 'ERROR'
};
var baseStatesConditions = {
  NOT_RESPONDER: false,
  RESPONDER_INACTIVE_PRESS_IN: false,
  RESPONDER_INACTIVE_PRESS_OUT: false,
  RESPONDER_ACTIVE_PRESS_IN: false,
  RESPONDER_ACTIVE_PRESS_OUT: false,
  RESPONDER_ACTIVE_LONG_PRESS_IN: false,
  RESPONDER_ACTIVE_LONG_PRESS_OUT: false,
  ERROR: false
};
var IsActive = Object.assign({}, baseStatesConditions, {
  RESPONDER_ACTIVE_PRESS_OUT: true,
  RESPONDER_ACTIVE_PRESS_IN: true
});
var IsPressingIn = Object.assign({}, baseStatesConditions, {
  RESPONDER_INACTIVE_PRESS_IN: true,
  RESPONDER_ACTIVE_PRESS_IN: true,
  RESPONDER_ACTIVE_LONG_PRESS_IN: true
});
var IsLongPressingIn = Object.assign({}, baseStatesConditions, {
  RESPONDER_ACTIVE_LONG_PRESS_IN: true
});
var Signals = {
  DELAY: 'DELAY',
  RESPONDER_GRANT: 'RESPONDER_GRANT',
  RESPONDER_RELEASE: 'RESPONDER_RELEASE',
  RESPONDER_TERMINATED: 'RESPONDER_TERMINATED',
  ENTER_PRESS_RECT: 'ENTER_PRESS_RECT',
  LEAVE_PRESS_RECT: 'LEAVE_PRESS_RECT',
  LONG_PRESS_DETECTED: 'LONG_PRESS_DETECTED'
};
var Transitions = {
  NOT_RESPONDER: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.RESPONDER_INACTIVE_PRESS_IN,
    RESPONDER_RELEASE: States.ERROR,
    RESPONDER_TERMINATED: States.ERROR,
    ENTER_PRESS_RECT: States.ERROR,
    LEAVE_PRESS_RECT: States.ERROR,
    LONG_PRESS_DETECTED: States.ERROR
  },
  RESPONDER_INACTIVE_PRESS_IN: {
    DELAY: States.RESPONDER_ACTIVE_PRESS_IN,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR
  },
  RESPONDER_INACTIVE_PRESS_OUT: {
    DELAY: States.RESPONDER_ACTIVE_PRESS_OUT,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR
  },
  RESPONDER_ACTIVE_PRESS_IN: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.RESPONDER_ACTIVE_LONG_PRESS_IN
  },
  RESPONDER_ACTIVE_PRESS_OUT: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR
  },
  RESPONDER_ACTIVE_LONG_PRESS_IN: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_OUT,
    LONG_PRESS_DETECTED: States.RESPONDER_ACTIVE_LONG_PRESS_IN
  },
  RESPONDER_ACTIVE_LONG_PRESS_OUT: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR
  },
  error: {
    DELAY: States.NOT_RESPONDER,
    RESPONDER_GRANT: States.RESPONDER_INACTIVE_PRESS_IN,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.NOT_RESPONDER,
    LEAVE_PRESS_RECT: States.NOT_RESPONDER,
    LONG_PRESS_DETECTED: States.NOT_RESPONDER
  }
};
var HIGHLIGHT_DELAY_MS = 130;
var PRESS_EXPAND_PX = 20;
var LONG_PRESS_THRESHOLD = 500;
var LONG_PRESS_DELAY_MS = LONG_PRESS_THRESHOLD - HIGHLIGHT_DELAY_MS;
var LONG_PRESS_ALLOWED_MOVEMENT = 10;
var TouchableMixin = {
  componentDidMount: function componentDidMount() {
    if (!_Platform.default.isTV) {
      return;
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    this.touchableDelayTimeout && clearTimeout(this.touchableDelayTimeout);
    this.longPressDelayTimeout && clearTimeout(this.longPressDelayTimeout);
    this.pressOutDelayTimeout && clearTimeout(this.pressOutDelayTimeout);
  },
  touchableGetInitialState: function touchableGetInitialState() {
    return {
      touchable: {
        touchState: undefined,
        responderID: null
      }
    };
  },
  touchableHandleResponderTerminationRequest: function touchableHandleResponderTerminationRequest() {
    return !this.props.rejectResponderTermination;
  },
  touchableHandleStartShouldSetResponder: function touchableHandleStartShouldSetResponder() {
    return !this.props.disabled;
  },
  touchableLongPressCancelsPress: function touchableLongPressCancelsPress() {
    return true;
  },
  touchableHandleResponderGrant: function touchableHandleResponderGrant(e) {
    var dispatchID = e.currentTarget;
    e.persist();
    this.pressOutDelayTimeout && clearTimeout(this.pressOutDelayTimeout);
    this.pressOutDelayTimeout = null;
    this.state.touchable.touchState = States.NOT_RESPONDER;
    this.state.touchable.responderID = dispatchID;
    this._receiveSignal(Signals.RESPONDER_GRANT, e);
    var delayMS = this.touchableGetHighlightDelayMS !== undefined ? Math.max(this.touchableGetHighlightDelayMS(), 0) : HIGHLIGHT_DELAY_MS;
    delayMS = isNaN(delayMS) ? HIGHLIGHT_DELAY_MS : delayMS;
    if (delayMS !== 0) {
      this.touchableDelayTimeout = setTimeout(this._handleDelay.bind(this, e), delayMS);
    } else {
      this._handleDelay(e);
    }
    var longDelayMS = this.touchableGetLongPressDelayMS !== undefined ? Math.max(this.touchableGetLongPressDelayMS(), 10) : LONG_PRESS_DELAY_MS;
    longDelayMS = isNaN(longDelayMS) ? LONG_PRESS_DELAY_MS : longDelayMS;
    this.longPressDelayTimeout = setTimeout(this._handleLongDelay.bind(this, e), longDelayMS + delayMS);
  },
  touchableHandleResponderRelease: function touchableHandleResponderRelease(e) {
    this.pressInLocation = null;
    this._receiveSignal(Signals.RESPONDER_RELEASE, e);
  },
  touchableHandleResponderTerminate: function touchableHandleResponderTerminate(e) {
    this.pressInLocation = null;
    this._receiveSignal(Signals.RESPONDER_TERMINATED, e);
  },
  touchableHandleResponderMove: function touchableHandleResponderMove(e) {
    if (!this.state.touchable.positionOnActivate) {
      return;
    }
    var positionOnActivate = this.state.touchable.positionOnActivate;
    var dimensionsOnActivate = this.state.touchable.dimensionsOnActivate;
    var pressRectOffset = this.touchableGetPressRectOffset ? this.touchableGetPressRectOffset() : {
      left: PRESS_EXPAND_PX,
      right: PRESS_EXPAND_PX,
      top: PRESS_EXPAND_PX,
      bottom: PRESS_EXPAND_PX
    };
    var pressExpandLeft = pressRectOffset.left;
    var pressExpandTop = pressRectOffset.top;
    var pressExpandRight = pressRectOffset.right;
    var pressExpandBottom = pressRectOffset.bottom;
    var hitSlop = this.touchableGetHitSlop ? this.touchableGetHitSlop() : null;
    if (hitSlop) {
      pressExpandLeft += hitSlop.left || 0;
      pressExpandTop += hitSlop.top || 0;
      pressExpandRight += hitSlop.right || 0;
      pressExpandBottom += hitSlop.bottom || 0;
    }
    var touch = extractSingleTouch(e.nativeEvent);
    var pageX = touch && touch.pageX;
    var pageY = touch && touch.pageY;
    if (this.pressInLocation) {
      var movedDistance = this._getDistanceBetweenPoints(pageX, pageY, this.pressInLocation.pageX, this.pressInLocation.pageY);
      if (movedDistance > LONG_PRESS_ALLOWED_MOVEMENT) {
        this._cancelLongPressDelayTimeout();
      }
    }
    var isTouchWithinActive = pageX > positionOnActivate.left - pressExpandLeft && pageY > positionOnActivate.top - pressExpandTop && pageX < positionOnActivate.left + dimensionsOnActivate.width + pressExpandRight && pageY < positionOnActivate.top + dimensionsOnActivate.height + pressExpandBottom;
    if (isTouchWithinActive) {
      var prevState = this.state.touchable.touchState;
      this._receiveSignal(Signals.ENTER_PRESS_RECT, e);
      var curState = this.state.touchable.touchState;
      if (curState === States.RESPONDER_INACTIVE_PRESS_IN && prevState !== States.RESPONDER_INACTIVE_PRESS_IN) {
        this._cancelLongPressDelayTimeout();
      }
    } else {
      this._cancelLongPressDelayTimeout();
      this._receiveSignal(Signals.LEAVE_PRESS_RECT, e);
    }
  },
  touchableHandleFocus: function touchableHandleFocus(e) {
    this.props.onFocus && this.props.onFocus(e);
  },
  touchableHandleBlur: function touchableHandleBlur(e) {
    this.props.onBlur && this.props.onBlur(e);
  },
  _remeasureMetricsOnActivation: function _remeasureMetricsOnActivation() {
    var responderID = this.state.touchable.responderID;
    if (responderID == null) {
      return;
    }
    if (typeof responderID === 'number') {
      _UIManager.default.measure(responderID, this._handleQueryLayout);
    } else {
      responderID.measure(this._handleQueryLayout);
    }
  },
  _handleQueryLayout: function _handleQueryLayout(l, t, w, h, globalX, globalY) {
    if (!l && !t && !w && !h && !globalX && !globalY) {
      return;
    }
    this.state.touchable.positionOnActivate && _Position.default.release(this.state.touchable.positionOnActivate);
    this.state.touchable.dimensionsOnActivate && _BoundingDimensions.default.release(this.state.touchable.dimensionsOnActivate);
    this.state.touchable.positionOnActivate = _Position.default.getPooled(globalX, globalY);
    this.state.touchable.dimensionsOnActivate = _BoundingDimensions.default.getPooled(w, h);
  },
  _handleDelay: function _handleDelay(e) {
    this.touchableDelayTimeout = null;
    this._receiveSignal(Signals.DELAY, e);
  },
  _handleLongDelay: function _handleLongDelay(e) {
    this.longPressDelayTimeout = null;
    var curState = this.state.touchable.touchState;
    if (curState === States.RESPONDER_ACTIVE_PRESS_IN || curState === States.RESPONDER_ACTIVE_LONG_PRESS_IN) {
      this._receiveSignal(Signals.LONG_PRESS_DETECTED, e);
    }
  },
  _receiveSignal: function _receiveSignal(signal, e) {
    var responderID = this.state.touchable.responderID;
    var curState = this.state.touchable.touchState;
    var nextState = Transitions[curState] && Transitions[curState][signal];
    if (!responderID && signal === Signals.RESPONDER_RELEASE) {
      return;
    }
    if (!nextState) {
      throw new Error('Unrecognized signal `' + signal + '` or state `' + curState + '` for Touchable responder `' + typeof this.state.touchable.responderID === 'number' ? this.state.touchable.responderID : 'host component' + '`');
    }
    if (nextState === States.ERROR) {
      throw new Error('Touchable cannot transition from `' + curState + '` to `' + signal + '` for responder `' + typeof this.state.touchable.responderID === 'number' ? this.state.touchable.responderID : '<<host component>>' + '`');
    }
    if (curState !== nextState) {
      this._performSideEffectsForTransition(curState, nextState, signal, e);
      this.state.touchable.touchState = nextState;
    }
  },
  _cancelLongPressDelayTimeout: function _cancelLongPressDelayTimeout() {
    this.longPressDelayTimeout && clearTimeout(this.longPressDelayTimeout);
    this.longPressDelayTimeout = null;
  },
  _isHighlight: function _isHighlight(state) {
    return state === States.RESPONDER_ACTIVE_PRESS_IN || state === States.RESPONDER_ACTIVE_LONG_PRESS_IN;
  },
  _savePressInLocation: function _savePressInLocation(e) {
    var touch = extractSingleTouch(e.nativeEvent);
    var pageX = touch && touch.pageX;
    var pageY = touch && touch.pageY;
    var locationX = touch && touch.locationX;
    var locationY = touch && touch.locationY;
    this.pressInLocation = {
      pageX: pageX,
      pageY: pageY,
      locationX: locationX,
      locationY: locationY
    };
  },
  _getDistanceBetweenPoints: function _getDistanceBetweenPoints(aX, aY, bX, bY) {
    var deltaX = aX - bX;
    var deltaY = aY - bY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  },
  _performSideEffectsForTransition: function _performSideEffectsForTransition(curState, nextState, signal, e) {
    var curIsHighlight = this._isHighlight(curState);
    var newIsHighlight = this._isHighlight(nextState);
    var isFinalSignal = signal === Signals.RESPONDER_TERMINATED || signal === Signals.RESPONDER_RELEASE;
    if (isFinalSignal) {
      this._cancelLongPressDelayTimeout();
    }
    var isInitialTransition = curState === States.NOT_RESPONDER && nextState === States.RESPONDER_INACTIVE_PRESS_IN;
    var isActiveTransition = !IsActive[curState] && IsActive[nextState];
    if (isInitialTransition || isActiveTransition) {
      this._remeasureMetricsOnActivation();
    }
    if (IsPressingIn[curState] && signal === Signals.LONG_PRESS_DETECTED) {
      this.touchableHandleLongPress && this.touchableHandleLongPress(e);
    }
    if (newIsHighlight && !curIsHighlight) {
      this._startHighlight(e);
    } else if (!newIsHighlight && curIsHighlight) {
      this._endHighlight(e);
    }
    if (IsPressingIn[curState] && signal === Signals.RESPONDER_RELEASE) {
      var hasLongPressHandler = !!this.props.onLongPress;
      var pressIsLongButStillCallOnPress = IsLongPressingIn[curState] && (!hasLongPressHandler || !this.touchableLongPressCancelsPress());
      var shouldInvokePress = !IsLongPressingIn[curState] || pressIsLongButStillCallOnPress;
      if (shouldInvokePress && this.touchableHandlePress) {
        if (!newIsHighlight && !curIsHighlight) {
          this._startHighlight(e);
          this._endHighlight(e);
        }
        if (_Platform.default.OS === 'android' && !this.props.touchSoundDisabled) {
          _SoundManager.default.playTouchSound();
        }
        this.touchableHandlePress(e);
      }
    }
    this.touchableDelayTimeout && clearTimeout(this.touchableDelayTimeout);
    this.touchableDelayTimeout = null;
  },
  _startHighlight: function _startHighlight(e) {
    this._savePressInLocation(e);
    this.touchableHandleActivePressIn && this.touchableHandleActivePressIn(e);
  },
  _endHighlight: function _endHighlight(e) {
    var _this = this;
    if (this.touchableHandleActivePressOut) {
      if (this.touchableGetPressOutDelayMS && this.touchableGetPressOutDelayMS()) {
        this.pressOutDelayTimeout = setTimeout(function () {
          _this.touchableHandleActivePressOut(e);
        }, this.touchableGetPressOutDelayMS());
      } else {
        this.touchableHandleActivePressOut(e);
      }
    }
  },
  withoutDefaultFocusAndBlur: {}
};
var touchableHandleFocus = TouchableMixin.touchableHandleFocus,
  touchableHandleBlur = TouchableMixin.touchableHandleBlur,
  TouchableMixinWithoutDefaultFocusAndBlur = (0, _objectWithoutProperties2.default)(TouchableMixin, ["touchableHandleFocus", "touchableHandleBlur"]);
TouchableMixin.withoutDefaultFocusAndBlur = TouchableMixinWithoutDefaultFocusAndBlur;
var Touchable = {
  Mixin: TouchableMixin,
  renderDebugView: function renderDebugView(_ref) {
    var color = _ref.color,
      hitSlop = _ref.hitSlop;
    if (__DEV__) {
      return (0, _jsxRuntime.jsx)(_PressabilityDebug.PressabilityDebugView, {
        color: color,
        hitSlop: hitSlop
      });
    }
    return null;
  }
};
module.exports = Touchable;