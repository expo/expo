var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _SoundManager = _interopRequireDefault(require("../Components/Sound/SoundManager"));
var _ReactNativeFeatureFlags = _interopRequireDefault(require("../ReactNative/ReactNativeFeatureFlags"));
var _UIManager = _interopRequireDefault(require("../ReactNative/UIManager"));
var _Rect = require("../StyleSheet/Rect");
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _HoverState = require("./HoverState");
var _PressabilityPerformanceEventEmitter = _interopRequireDefault(require("./PressabilityPerformanceEventEmitter.js"));
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var Transitions = Object.freeze({
  NOT_RESPONDER: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'RESPONDER_INACTIVE_PRESS_IN',
    RESPONDER_RELEASE: 'ERROR',
    RESPONDER_TERMINATED: 'ERROR',
    ENTER_PRESS_RECT: 'ERROR',
    LEAVE_PRESS_RECT: 'ERROR',
    LONG_PRESS_DETECTED: 'ERROR'
  },
  RESPONDER_INACTIVE_PRESS_IN: {
    DELAY: 'RESPONDER_ACTIVE_PRESS_IN',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR'
  },
  RESPONDER_INACTIVE_PRESS_OUT: {
    DELAY: 'RESPONDER_ACTIVE_PRESS_OUT',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_INACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR'
  },
  RESPONDER_ACTIVE_PRESS_IN: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'RESPONDER_ACTIVE_LONG_PRESS_IN'
  },
  RESPONDER_ACTIVE_PRESS_OUT: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR'
  },
  RESPONDER_ACTIVE_LONG_PRESS_IN: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT',
    LONG_PRESS_DETECTED: 'RESPONDER_ACTIVE_LONG_PRESS_IN'
  },
  RESPONDER_ACTIVE_LONG_PRESS_OUT: {
    DELAY: 'ERROR',
    RESPONDER_GRANT: 'ERROR',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_IN',
    LEAVE_PRESS_RECT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT',
    LONG_PRESS_DETECTED: 'ERROR'
  },
  ERROR: {
    DELAY: 'NOT_RESPONDER',
    RESPONDER_GRANT: 'RESPONDER_INACTIVE_PRESS_IN',
    RESPONDER_RELEASE: 'NOT_RESPONDER',
    RESPONDER_TERMINATED: 'NOT_RESPONDER',
    ENTER_PRESS_RECT: 'NOT_RESPONDER',
    LEAVE_PRESS_RECT: 'NOT_RESPONDER',
    LONG_PRESS_DETECTED: 'NOT_RESPONDER'
  }
});
var isActiveSignal = function isActiveSignal(signal) {
  return signal === 'RESPONDER_ACTIVE_PRESS_IN' || signal === 'RESPONDER_ACTIVE_LONG_PRESS_IN';
};
var isActivationSignal = function isActivationSignal(signal) {
  return signal === 'RESPONDER_ACTIVE_PRESS_OUT' || signal === 'RESPONDER_ACTIVE_PRESS_IN';
};
var isPressInSignal = function isPressInSignal(signal) {
  return signal === 'RESPONDER_INACTIVE_PRESS_IN' || signal === 'RESPONDER_ACTIVE_PRESS_IN' || signal === 'RESPONDER_ACTIVE_LONG_PRESS_IN';
};
var isTerminalSignal = function isTerminalSignal(signal) {
  return signal === 'RESPONDER_TERMINATED' || signal === 'RESPONDER_RELEASE';
};
var DEFAULT_LONG_PRESS_DELAY_MS = 500;
var DEFAULT_PRESS_RECT_OFFSETS = {
  bottom: 30,
  left: 20,
  right: 20,
  top: 20
};
var DEFAULT_MIN_PRESS_DURATION = 130;
var DEFAULT_LONG_PRESS_DEACTIVATION_DISTANCE = 10;
var longPressDeactivationDistance = DEFAULT_LONG_PRESS_DEACTIVATION_DISTANCE;
var Pressability = function () {
  function Pressability(config) {
    var _this = this;
    (0, _classCallCheck2.default)(this, Pressability);
    this._eventHandlers = null;
    this._hoverInDelayTimeout = null;
    this._hoverOutDelayTimeout = null;
    this._isHovered = false;
    this._longPressDelayTimeout = null;
    this._pressDelayTimeout = null;
    this._pressOutDelayTimeout = null;
    this._responderID = null;
    this._responderRegion = null;
    this._touchState = 'NOT_RESPONDER';
    this._measureCallback = function (left, top, width, height, pageX, pageY) {
      if (!left && !top && !width && !height && !pageX && !pageY) {
        return;
      }
      _this._responderRegion = {
        bottom: pageY + height,
        left: pageX,
        right: pageX + width,
        top: pageY
      };
    };
    this.configure(config);
  }
  (0, _createClass2.default)(Pressability, [{
    key: "configure",
    value: function configure(config) {
      this._config = config;
    }
  }, {
    key: "reset",
    value: function reset() {
      this._cancelHoverInDelayTimeout();
      this._cancelHoverOutDelayTimeout();
      this._cancelLongPressDelayTimeout();
      this._cancelPressDelayTimeout();
      this._cancelPressOutDelayTimeout();
      this._config = Object.freeze({});
    }
  }, {
    key: "getEventHandlers",
    value: function getEventHandlers() {
      if (this._eventHandlers == null) {
        this._eventHandlers = this._createEventHandlers();
      }
      return this._eventHandlers;
    }
  }, {
    key: "_createEventHandlers",
    value: function _createEventHandlers() {
      var _this2 = this;
      var focusEventHandlers = {
        onBlur: function onBlur(event) {
          var onBlur = _this2._config.onBlur;
          if (onBlur != null) {
            onBlur(event);
          }
        },
        onFocus: function onFocus(event) {
          var onFocus = _this2._config.onFocus;
          if (onFocus != null) {
            onFocus(event);
          }
        }
      };
      var responderEventHandlers = {
        onStartShouldSetResponder: function onStartShouldSetResponder() {
          var disabled = _this2._config.disabled;
          if (disabled == null) {
            var onStartShouldSetResponder_DEPRECATED = _this2._config.onStartShouldSetResponder_DEPRECATED;
            return onStartShouldSetResponder_DEPRECATED == null ? true : onStartShouldSetResponder_DEPRECATED();
          }
          return !disabled;
        },
        onResponderGrant: function onResponderGrant(event) {
          event.persist();
          _this2._cancelPressOutDelayTimeout();
          _this2._responderID = event.currentTarget;
          _this2._touchState = 'NOT_RESPONDER';
          _this2._receiveSignal('RESPONDER_GRANT', event);
          var delayPressIn = normalizeDelay(_this2._config.delayPressIn);
          if (delayPressIn > 0) {
            _this2._pressDelayTimeout = setTimeout(function () {
              _this2._receiveSignal('DELAY', event);
            }, delayPressIn);
          } else {
            _this2._receiveSignal('DELAY', event);
          }
          var delayLongPress = normalizeDelay(_this2._config.delayLongPress, 10, DEFAULT_LONG_PRESS_DELAY_MS - delayPressIn);
          _this2._longPressDelayTimeout = setTimeout(function () {
            _this2._handleLongPress(event);
          }, delayLongPress + delayPressIn);
        },
        onResponderMove: function onResponderMove(event) {
          var onPressMove = _this2._config.onPressMove;
          if (onPressMove != null) {
            onPressMove(event);
          }
          var responderRegion = _this2._responderRegion;
          if (responderRegion == null) {
            return;
          }
          var touch = getTouchFromPressEvent(event);
          if (touch == null) {
            _this2._cancelLongPressDelayTimeout();
            _this2._receiveSignal('LEAVE_PRESS_RECT', event);
            return;
          }
          if (_this2._touchActivatePosition != null) {
            var deltaX = _this2._touchActivatePosition.pageX - touch.pageX;
            var deltaY = _this2._touchActivatePosition.pageY - touch.pageY;
            if (Math.hypot(deltaX, deltaY) > longPressDeactivationDistance) {
              _this2._cancelLongPressDelayTimeout();
            }
          }
          if (_this2._isTouchWithinResponderRegion(touch, responderRegion)) {
            _this2._receiveSignal('ENTER_PRESS_RECT', event);
          } else {
            _this2._cancelLongPressDelayTimeout();
            _this2._receiveSignal('LEAVE_PRESS_RECT', event);
          }
        },
        onResponderRelease: function onResponderRelease(event) {
          _this2._receiveSignal('RESPONDER_RELEASE', event);
        },
        onResponderTerminate: function onResponderTerminate(event) {
          _this2._receiveSignal('RESPONDER_TERMINATED', event);
        },
        onResponderTerminationRequest: function onResponderTerminationRequest() {
          var cancelable = _this2._config.cancelable;
          if (cancelable == null) {
            var onResponderTerminationRequest_DEPRECATED = _this2._config.onResponderTerminationRequest_DEPRECATED;
            return onResponderTerminationRequest_DEPRECATED == null ? true : onResponderTerminationRequest_DEPRECATED();
          }
          return cancelable;
        },
        onClick: function onClick(event) {
          var _this2$_config = _this2._config,
            onPress = _this2$_config.onPress,
            disabled = _this2$_config.disabled;
          if (onPress != null && disabled !== true) {
            onPress(event);
          }
        }
      };
      if (process.env.NODE_ENV === 'test') {
        responderEventHandlers.onStartShouldSetResponder.testOnly_pressabilityConfig = function () {
          return _this2._config;
        };
      }
      if (_ReactNativeFeatureFlags.default.shouldPressibilityUseW3CPointerEventsForHover()) {
        var hoverPointerEvents = {
          onPointerEnter: undefined,
          onPointerLeave: undefined
        };
        var _this$_config = this._config,
          onHoverIn = _this$_config.onHoverIn,
          onHoverOut = _this$_config.onHoverOut;
        if (onHoverIn != null) {
          hoverPointerEvents.onPointerEnter = function (event) {
            _this2._isHovered = true;
            _this2._cancelHoverOutDelayTimeout();
            if (onHoverIn != null) {
              var delayHoverIn = normalizeDelay(_this2._config.delayHoverIn);
              if (delayHoverIn > 0) {
                event.persist();
                _this2._hoverInDelayTimeout = setTimeout(function () {
                  onHoverIn(convertPointerEventToMouseEvent(event));
                }, delayHoverIn);
              } else {
                onHoverIn(convertPointerEventToMouseEvent(event));
              }
            }
          };
        }
        if (onHoverOut != null) {
          hoverPointerEvents.onPointerLeave = function (event) {
            if (_this2._isHovered) {
              _this2._isHovered = false;
              _this2._cancelHoverInDelayTimeout();
              if (onHoverOut != null) {
                var delayHoverOut = normalizeDelay(_this2._config.delayHoverOut);
                if (delayHoverOut > 0) {
                  event.persist();
                  _this2._hoverOutDelayTimeout = setTimeout(function () {
                    onHoverOut(convertPointerEventToMouseEvent(event));
                  }, delayHoverOut);
                } else {
                  onHoverOut(convertPointerEventToMouseEvent(event));
                }
              }
            }
          };
        }
        return Object.assign({}, focusEventHandlers, responderEventHandlers, hoverPointerEvents);
      } else {
        var mouseEventHandlers = _Platform.default.OS === 'ios' || _Platform.default.OS === 'android' ? null : {
          onMouseEnter: function onMouseEnter(event) {
            if ((0, _HoverState.isHoverEnabled)()) {
              _this2._isHovered = true;
              _this2._cancelHoverOutDelayTimeout();
              var _onHoverIn = _this2._config.onHoverIn;
              if (_onHoverIn != null) {
                var delayHoverIn = normalizeDelay(_this2._config.delayHoverIn);
                if (delayHoverIn > 0) {
                  event.persist();
                  _this2._hoverInDelayTimeout = setTimeout(function () {
                    _onHoverIn(event);
                  }, delayHoverIn);
                } else {
                  _onHoverIn(event);
                }
              }
            }
          },
          onMouseLeave: function onMouseLeave(event) {
            if (_this2._isHovered) {
              _this2._isHovered = false;
              _this2._cancelHoverInDelayTimeout();
              var _onHoverOut = _this2._config.onHoverOut;
              if (_onHoverOut != null) {
                var delayHoverOut = normalizeDelay(_this2._config.delayHoverOut);
                if (delayHoverOut > 0) {
                  event.persist();
                  _this2._hoverInDelayTimeout = setTimeout(function () {
                    _onHoverOut(event);
                  }, delayHoverOut);
                } else {
                  _onHoverOut(event);
                }
              }
            }
          }
        };
        return Object.assign({}, focusEventHandlers, responderEventHandlers, mouseEventHandlers);
      }
    }
  }, {
    key: "_receiveSignal",
    value: function _receiveSignal(signal, event) {
      var _Transitions$prevStat;
      if (event.nativeEvent.timestamp != null) {
        _PressabilityPerformanceEventEmitter.default.emitEvent(function () {
          return {
            signal: signal,
            nativeTimestamp: event.nativeEvent.timestamp
          };
        });
      }
      var prevState = this._touchState;
      var nextState = (_Transitions$prevStat = Transitions[prevState]) == null ? void 0 : _Transitions$prevStat[signal];
      if (this._responderID == null && signal === 'RESPONDER_RELEASE') {
        return;
      }
      (0, _invariant.default)(nextState != null && nextState !== 'ERROR', 'Pressability: Invalid signal `%s` for state `%s` on responder: %s', signal, prevState, typeof this._responderID === 'number' ? this._responderID : '<<host component>>');
      if (prevState !== nextState) {
        this._performTransitionSideEffects(prevState, nextState, signal, event);
        this._touchState = nextState;
      }
    }
  }, {
    key: "_performTransitionSideEffects",
    value: function _performTransitionSideEffects(prevState, nextState, signal, event) {
      if (isTerminalSignal(signal)) {
        this._touchActivatePosition = null;
        this._cancelLongPressDelayTimeout();
      }
      var isInitialTransition = prevState === 'NOT_RESPONDER' && nextState === 'RESPONDER_INACTIVE_PRESS_IN';
      var isActivationTransition = !isActivationSignal(prevState) && isActivationSignal(nextState);
      if (isInitialTransition || isActivationTransition) {
        this._measureResponderRegion();
      }
      if (isPressInSignal(prevState) && signal === 'LONG_PRESS_DETECTED') {
        var onLongPress = this._config.onLongPress;
        if (onLongPress != null) {
          onLongPress(event);
        }
      }
      var isPrevActive = isActiveSignal(prevState);
      var isNextActive = isActiveSignal(nextState);
      if (!isPrevActive && isNextActive) {
        this._activate(event);
      } else if (isPrevActive && !isNextActive) {
        this._deactivate(event);
      }
      if (isPressInSignal(prevState) && signal === 'RESPONDER_RELEASE') {
        if (!isNextActive && !isPrevActive) {
          this._activate(event);
          this._deactivate(event);
        }
        var _this$_config2 = this._config,
          _onLongPress = _this$_config2.onLongPress,
          onPress = _this$_config2.onPress,
          android_disableSound = _this$_config2.android_disableSound;
        if (onPress != null) {
          var isPressCanceledByLongPress = _onLongPress != null && prevState === 'RESPONDER_ACTIVE_LONG_PRESS_IN' && this._shouldLongPressCancelPress();
          if (!isPressCanceledByLongPress) {
            if (_Platform.default.OS === 'android' && android_disableSound !== true) {
              _SoundManager.default.playTouchSound();
            }
            onPress(event);
          }
        }
      }
      this._cancelPressDelayTimeout();
    }
  }, {
    key: "_activate",
    value: function _activate(event) {
      var onPressIn = this._config.onPressIn;
      var _getTouchFromPressEve = getTouchFromPressEvent(event),
        pageX = _getTouchFromPressEve.pageX,
        pageY = _getTouchFromPressEve.pageY;
      this._touchActivatePosition = {
        pageX: pageX,
        pageY: pageY
      };
      this._touchActivateTime = Date.now();
      if (onPressIn != null) {
        onPressIn(event);
      }
    }
  }, {
    key: "_deactivate",
    value: function _deactivate(event) {
      var onPressOut = this._config.onPressOut;
      if (onPressOut != null) {
        var _this$_touchActivateT;
        var minPressDuration = normalizeDelay(this._config.minPressDuration, 0, DEFAULT_MIN_PRESS_DURATION);
        var pressDuration = Date.now() - ((_this$_touchActivateT = this._touchActivateTime) != null ? _this$_touchActivateT : 0);
        var delayPressOut = Math.max(minPressDuration - pressDuration, normalizeDelay(this._config.delayPressOut));
        if (delayPressOut > 0) {
          event.persist();
          this._pressOutDelayTimeout = setTimeout(function () {
            onPressOut(event);
          }, delayPressOut);
        } else {
          onPressOut(event);
        }
      }
      this._touchActivateTime = null;
    }
  }, {
    key: "_measureResponderRegion",
    value: function _measureResponderRegion() {
      if (this._responderID == null) {
        return;
      }
      if (typeof this._responderID === 'number') {
        _UIManager.default.measure(this._responderID, this._measureCallback);
      } else {
        this._responderID.measure(this._measureCallback);
      }
    }
  }, {
    key: "_isTouchWithinResponderRegion",
    value: function _isTouchWithinResponderRegion(touch, responderRegion) {
      var _pressRectOffset$bott, _pressRectOffset$left, _pressRectOffset$righ, _pressRectOffset$top;
      var hitSlop = (0, _Rect.normalizeRect)(this._config.hitSlop);
      var pressRectOffset = (0, _Rect.normalizeRect)(this._config.pressRectOffset);
      var regionBottom = responderRegion.bottom;
      var regionLeft = responderRegion.left;
      var regionRight = responderRegion.right;
      var regionTop = responderRegion.top;
      if (hitSlop != null) {
        if (hitSlop.bottom != null) {
          regionBottom += hitSlop.bottom;
        }
        if (hitSlop.left != null) {
          regionLeft -= hitSlop.left;
        }
        if (hitSlop.right != null) {
          regionRight += hitSlop.right;
        }
        if (hitSlop.top != null) {
          regionTop -= hitSlop.top;
        }
      }
      regionBottom += (_pressRectOffset$bott = pressRectOffset == null ? void 0 : pressRectOffset.bottom) != null ? _pressRectOffset$bott : DEFAULT_PRESS_RECT_OFFSETS.bottom;
      regionLeft -= (_pressRectOffset$left = pressRectOffset == null ? void 0 : pressRectOffset.left) != null ? _pressRectOffset$left : DEFAULT_PRESS_RECT_OFFSETS.left;
      regionRight += (_pressRectOffset$righ = pressRectOffset == null ? void 0 : pressRectOffset.right) != null ? _pressRectOffset$righ : DEFAULT_PRESS_RECT_OFFSETS.right;
      regionTop -= (_pressRectOffset$top = pressRectOffset == null ? void 0 : pressRectOffset.top) != null ? _pressRectOffset$top : DEFAULT_PRESS_RECT_OFFSETS.top;
      return touch.pageX > regionLeft && touch.pageX < regionRight && touch.pageY > regionTop && touch.pageY < regionBottom;
    }
  }, {
    key: "_handleLongPress",
    value: function _handleLongPress(event) {
      if (this._touchState === 'RESPONDER_ACTIVE_PRESS_IN' || this._touchState === 'RESPONDER_ACTIVE_LONG_PRESS_IN') {
        this._receiveSignal('LONG_PRESS_DETECTED', event);
      }
    }
  }, {
    key: "_shouldLongPressCancelPress",
    value: function _shouldLongPressCancelPress() {
      return this._config.onLongPressShouldCancelPress_DEPRECATED == null || this._config.onLongPressShouldCancelPress_DEPRECATED();
    }
  }, {
    key: "_cancelHoverInDelayTimeout",
    value: function _cancelHoverInDelayTimeout() {
      if (this._hoverInDelayTimeout != null) {
        clearTimeout(this._hoverInDelayTimeout);
        this._hoverInDelayTimeout = null;
      }
    }
  }, {
    key: "_cancelHoverOutDelayTimeout",
    value: function _cancelHoverOutDelayTimeout() {
      if (this._hoverOutDelayTimeout != null) {
        clearTimeout(this._hoverOutDelayTimeout);
        this._hoverOutDelayTimeout = null;
      }
    }
  }, {
    key: "_cancelLongPressDelayTimeout",
    value: function _cancelLongPressDelayTimeout() {
      if (this._longPressDelayTimeout != null) {
        clearTimeout(this._longPressDelayTimeout);
        this._longPressDelayTimeout = null;
      }
    }
  }, {
    key: "_cancelPressDelayTimeout",
    value: function _cancelPressDelayTimeout() {
      if (this._pressDelayTimeout != null) {
        clearTimeout(this._pressDelayTimeout);
        this._pressDelayTimeout = null;
      }
    }
  }, {
    key: "_cancelPressOutDelayTimeout",
    value: function _cancelPressOutDelayTimeout() {
      if (this._pressOutDelayTimeout != null) {
        clearTimeout(this._pressOutDelayTimeout);
        this._pressOutDelayTimeout = null;
      }
    }
  }], [{
    key: "setLongPressDeactivationDistance",
    value: function setLongPressDeactivationDistance(distance) {
      longPressDeactivationDistance = distance;
    }
  }]);
  return Pressability;
}();
exports.default = Pressability;
function normalizeDelay(delay) {
  var min = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var fallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  return Math.max(min, delay != null ? delay : fallback);
}
var getTouchFromPressEvent = function getTouchFromPressEvent(event) {
  var _event$nativeEvent = event.nativeEvent,
    changedTouches = _event$nativeEvent.changedTouches,
    touches = _event$nativeEvent.touches;
  if (touches != null && touches.length > 0) {
    return touches[0];
  }
  if (changedTouches != null && changedTouches.length > 0) {
    return changedTouches[0];
  }
  return event.nativeEvent;
};
function convertPointerEventToMouseEvent(input) {
  var _input$nativeEvent = input.nativeEvent,
    clientX = _input$nativeEvent.clientX,
    clientY = _input$nativeEvent.clientY;
  return Object.assign({}, input, {
    nativeEvent: {
      clientX: clientX,
      clientY: clientY,
      pageX: clientX,
      pageY: clientY,
      timestamp: input.timeStamp
    }
  });
}