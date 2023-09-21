'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var InteractionManager = require('./InteractionManager');
var TouchHistoryMath = require('./TouchHistoryMath');
var currentCentroidXOfTouchesChangedAfter = TouchHistoryMath.currentCentroidXOfTouchesChangedAfter;
var currentCentroidYOfTouchesChangedAfter = TouchHistoryMath.currentCentroidYOfTouchesChangedAfter;
var previousCentroidXOfTouchesChangedAfter = TouchHistoryMath.previousCentroidXOfTouchesChangedAfter;
var previousCentroidYOfTouchesChangedAfter = TouchHistoryMath.previousCentroidYOfTouchesChangedAfter;
var currentCentroidX = TouchHistoryMath.currentCentroidX;
var currentCentroidY = TouchHistoryMath.currentCentroidY;
var PanResponder = {
  _initializeGestureState: function _initializeGestureState(gestureState) {
    gestureState.moveX = 0;
    gestureState.moveY = 0;
    gestureState.x0 = 0;
    gestureState.y0 = 0;
    gestureState.dx = 0;
    gestureState.dy = 0;
    gestureState.vx = 0;
    gestureState.vy = 0;
    gestureState.numberActiveTouches = 0;
    gestureState._accountsForMovesUpTo = 0;
  },
  _updateGestureStateOnMove: function _updateGestureStateOnMove(gestureState, touchHistory) {
    gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
    gestureState.moveX = currentCentroidXOfTouchesChangedAfter(touchHistory, gestureState._accountsForMovesUpTo);
    gestureState.moveY = currentCentroidYOfTouchesChangedAfter(touchHistory, gestureState._accountsForMovesUpTo);
    var movedAfter = gestureState._accountsForMovesUpTo;
    var prevX = previousCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    var x = currentCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    var prevY = previousCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    var y = currentCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    var nextDX = gestureState.dx + (x - prevX);
    var nextDY = gestureState.dy + (y - prevY);
    var dt = touchHistory.mostRecentTimeStamp - gestureState._accountsForMovesUpTo;
    gestureState.vx = (nextDX - gestureState.dx) / dt;
    gestureState.vy = (nextDY - gestureState.dy) / dt;
    gestureState.dx = nextDX;
    gestureState.dy = nextDY;
    gestureState._accountsForMovesUpTo = touchHistory.mostRecentTimeStamp;
  },
  create: function create(config) {
    var interactionState = {
      handle: null
    };
    var gestureState = {
      stateID: Math.random(),
      moveX: 0,
      moveY: 0,
      x0: 0,
      y0: 0,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      numberActiveTouches: 0,
      _accountsForMovesUpTo: 0
    };
    var panHandlers = {
      onStartShouldSetResponder: function onStartShouldSetResponder(event) {
        return config.onStartShouldSetPanResponder == null ? false : config.onStartShouldSetPanResponder(event, gestureState);
      },
      onMoveShouldSetResponder: function onMoveShouldSetResponder(event) {
        return config.onMoveShouldSetPanResponder == null ? false : config.onMoveShouldSetPanResponder(event, gestureState);
      },
      onStartShouldSetResponderCapture: function onStartShouldSetResponderCapture(event) {
        if (event.nativeEvent.touches.length === 1) {
          PanResponder._initializeGestureState(gestureState);
        }
        gestureState.numberActiveTouches = event.touchHistory.numberActiveTouches;
        return config.onStartShouldSetPanResponderCapture != null ? config.onStartShouldSetPanResponderCapture(event, gestureState) : false;
      },
      onMoveShouldSetResponderCapture: function onMoveShouldSetResponderCapture(event) {
        var touchHistory = event.touchHistory;
        if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
          return false;
        }
        PanResponder._updateGestureStateOnMove(gestureState, touchHistory);
        return config.onMoveShouldSetPanResponderCapture ? config.onMoveShouldSetPanResponderCapture(event, gestureState) : false;
      },
      onResponderGrant: function onResponderGrant(event) {
        if (!interactionState.handle) {
          interactionState.handle = InteractionManager.createInteractionHandle();
        }
        gestureState.x0 = currentCentroidX(event.touchHistory);
        gestureState.y0 = currentCentroidY(event.touchHistory);
        gestureState.dx = 0;
        gestureState.dy = 0;
        if (config.onPanResponderGrant) {
          config.onPanResponderGrant(event, gestureState);
        }
        return config.onShouldBlockNativeResponder == null ? true : config.onShouldBlockNativeResponder(event, gestureState);
      },
      onResponderReject: function onResponderReject(event) {
        clearInteractionHandle(interactionState, config.onPanResponderReject, event, gestureState);
      },
      onResponderRelease: function onResponderRelease(event) {
        clearInteractionHandle(interactionState, config.onPanResponderRelease, event, gestureState);
        PanResponder._initializeGestureState(gestureState);
      },
      onResponderStart: function onResponderStart(event) {
        var touchHistory = event.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        if (config.onPanResponderStart) {
          config.onPanResponderStart(event, gestureState);
        }
      },
      onResponderMove: function onResponderMove(event) {
        var touchHistory = event.touchHistory;
        if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
          return;
        }
        PanResponder._updateGestureStateOnMove(gestureState, touchHistory);
        if (config.onPanResponderMove) {
          config.onPanResponderMove(event, gestureState);
        }
      },
      onResponderEnd: function onResponderEnd(event) {
        var touchHistory = event.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        clearInteractionHandle(interactionState, config.onPanResponderEnd, event, gestureState);
      },
      onResponderTerminate: function onResponderTerminate(event) {
        clearInteractionHandle(interactionState, config.onPanResponderTerminate, event, gestureState);
        PanResponder._initializeGestureState(gestureState);
      },
      onResponderTerminationRequest: function onResponderTerminationRequest(event) {
        return config.onPanResponderTerminationRequest == null ? true : config.onPanResponderTerminationRequest(event, gestureState);
      }
    };
    return {
      panHandlers: panHandlers,
      getInteractionHandle: function getInteractionHandle() {
        return interactionState.handle;
      }
    };
  }
};
function clearInteractionHandle(interactionState, callback, event, gestureState) {
  if (interactionState.handle) {
    InteractionManager.clearInteractionHandle(interactionState.handle);
    interactionState.handle = null;
  }
  if (callback) {
    callback(event, gestureState);
  }
}
var _default = PanResponder;
exports.default = _default;