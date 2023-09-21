'use strict';

if (__DEV__) {
  (function () {
    'use strict';
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === 'function') {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
    }
    "use strict";
    var React = require("react");
    require("react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore");
    var ReactNativePrivateInterface = require("react-native/Libraries/ReactPrivate/ReactNativePrivateInterface");
    var Scheduler = require("scheduler");
    var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function warn(format) {
      {
        {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          printWarning("warn", format, args);
        }
      }
    }
    function error(format) {
      {
        {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }
          printWarning("error", format, args);
        }
      }
    }
    function printWarning(level, format, args) {
      {
        var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
        var stack = ReactDebugCurrentFrame.getStackAddendum();
        if (stack !== "") {
          format += "%s";
          args = args.concat([stack]);
        }
        var argsWithFormat = args.map(function (item) {
          return String(item);
        });
        argsWithFormat.unshift("Warning: " + format);
        Function.prototype.apply.call(console[level], console, argsWithFormat);
      }
    }
    function invokeGuardedCallbackProd(name, func, context, a, b, c, d, e, f) {
      var funcArgs = Array.prototype.slice.call(arguments, 3);
      try {
        func.apply(context, funcArgs);
      } catch (error) {
        this.onError(error);
      }
    }
    var invokeGuardedCallbackImpl = invokeGuardedCallbackProd;
    {
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof document !== "undefined" && typeof document.createEvent === "function") {
        var fakeNode = document.createElement("react");
        invokeGuardedCallbackImpl = function invokeGuardedCallbackDev(name, func, context, a, b, c, d, e, f) {
          if (typeof document === "undefined" || document === null) {
            throw new Error("The `document` global was defined when React was initialized, but is not " + "defined anymore. This can happen in a test environment if a component " + "schedules an update from an asynchronous callback, but the test has already " + "finished running. To solve this, you can either unmount the component at " + "the end of your test (and ensure that any asynchronous operations get " + "canceled in `componentWillUnmount`), or you can change the test itself " + "to be asynchronous.");
          }
          var evt = document.createEvent("Event");
          var didCall = false;
          var didError = true;
          var windowEvent = window.event;
          var windowEventDescriptor = Object.getOwnPropertyDescriptor(window, "event");
          function restoreAfterDispatch() {
            fakeNode.removeEventListener(evtType, callCallback, false);
            if (typeof window.event !== "undefined" && window.hasOwnProperty("event")) {
              window.event = windowEvent;
            }
          }
          var funcArgs = Array.prototype.slice.call(arguments, 3);
          function callCallback() {
            didCall = true;
            restoreAfterDispatch();
            func.apply(context, funcArgs);
            didError = false;
          }
          var error;
          var didSetError = false;
          var isCrossOriginError = false;
          function handleWindowError(event) {
            error = event.error;
            didSetError = true;
            if (error === null && event.colno === 0 && event.lineno === 0) {
              isCrossOriginError = true;
            }
            if (event.defaultPrevented) {
              if (error != null && typeof error === "object") {
                try {
                  error._suppressLogging = true;
                } catch (inner) {}
              }
            }
          }
          var evtType = "react-" + (name ? name : "invokeguardedcallback");
          window.addEventListener("error", handleWindowError);
          fakeNode.addEventListener(evtType, callCallback, false);
          evt.initEvent(evtType, false, false);
          fakeNode.dispatchEvent(evt);
          if (windowEventDescriptor) {
            Object.defineProperty(window, "event", windowEventDescriptor);
          }
          if (didCall && didError) {
            if (!didSetError) {
              error = new Error("An error was thrown inside one of your components, but React " + "doesn't know what it was. This is likely due to browser " + 'flakiness. React does its best to preserve the "Pause on ' + 'exceptions" behavior of the DevTools, which requires some ' + "DEV-mode only tricks. It's possible that these don't work in " + "your browser. Try triggering the error in production mode, " + "or switching to a modern browser. If you suspect that this is " + "actually an issue with React, please file an issue.");
            } else if (isCrossOriginError) {
              error = new Error("A cross-origin error was thrown. React doesn't have access to " + "the actual error object in development. " + "See https://reactjs.org/link/crossorigin-error for more information.");
            }
            this.onError(error);
          }
          window.removeEventListener("error", handleWindowError);
          if (!didCall) {
            restoreAfterDispatch();
            return invokeGuardedCallbackProd.apply(this, arguments);
          }
        };
      }
    }
    var invokeGuardedCallbackImpl$1 = invokeGuardedCallbackImpl;
    var hasError = false;
    var caughtError = null;
    var hasRethrowError = false;
    var rethrowError = null;
    var reporter = {
      onError: function onError(error) {
        hasError = true;
        caughtError = error;
      }
    };
    function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
      hasError = false;
      caughtError = null;
      invokeGuardedCallbackImpl$1.apply(reporter, arguments);
    }
    function invokeGuardedCallbackAndCatchFirstError(name, func, context, a, b, c, d, e, f) {
      invokeGuardedCallback.apply(this, arguments);
      if (hasError) {
        var error = clearCaughtError();
        if (!hasRethrowError) {
          hasRethrowError = true;
          rethrowError = error;
        }
      }
    }
    function rethrowCaughtError() {
      if (hasRethrowError) {
        var error = rethrowError;
        hasRethrowError = false;
        rethrowError = null;
        throw error;
      }
    }
    function hasCaughtError() {
      return hasError;
    }
    function clearCaughtError() {
      if (hasError) {
        var error = caughtError;
        hasError = false;
        caughtError = null;
        return error;
      } else {
        throw new Error("clearCaughtError was called but no error was captured. This error " + "is likely caused by a bug in React. Please file an issue.");
      }
    }
    var isArrayImpl = Array.isArray;
    function isArray(a) {
      return isArrayImpl(a);
    }
    var getFiberCurrentPropsFromNode = null;
    var getInstanceFromNode = null;
    var getNodeFromInstance = null;
    function setComponentTree(getFiberCurrentPropsFromNodeImpl, getInstanceFromNodeImpl, getNodeFromInstanceImpl) {
      getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
      getInstanceFromNode = getInstanceFromNodeImpl;
      getNodeFromInstance = getNodeFromInstanceImpl;
      {
        if (!getNodeFromInstance || !getInstanceFromNode) {
          error("EventPluginUtils.setComponentTree(...): Injected " + "module is missing getNodeFromInstance or getInstanceFromNode.");
        }
      }
    }
    var validateEventDispatches;
    {
      validateEventDispatches = function validateEventDispatches(event) {
        var dispatchListeners = event._dispatchListeners;
        var dispatchInstances = event._dispatchInstances;
        var listenersIsArr = isArray(dispatchListeners);
        var listenersLen = listenersIsArr ? dispatchListeners.length : dispatchListeners ? 1 : 0;
        var instancesIsArr = isArray(dispatchInstances);
        var instancesLen = instancesIsArr ? dispatchInstances.length : dispatchInstances ? 1 : 0;
        if (instancesIsArr !== listenersIsArr || instancesLen !== listenersLen) {
          error("EventPluginUtils: Invalid `event`.");
        }
      };
    }
    function executeDispatch(event, listener, inst) {
      var type = event.type || "unknown-event";
      event.currentTarget = getNodeFromInstance(inst);
      invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
      event.currentTarget = null;
    }
    function executeDispatchesInOrder(event) {
      var dispatchListeners = event._dispatchListeners;
      var dispatchInstances = event._dispatchInstances;
      {
        validateEventDispatches(event);
      }
      if (isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length; i++) {
          if (event.isPropagationStopped()) {
            break;
          }
          executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
        }
      } else if (dispatchListeners) {
        executeDispatch(event, dispatchListeners, dispatchInstances);
      }
      event._dispatchListeners = null;
      event._dispatchInstances = null;
    }
    function executeDispatchesInOrderStopAtTrueImpl(event) {
      var dispatchListeners = event._dispatchListeners;
      var dispatchInstances = event._dispatchInstances;
      {
        validateEventDispatches(event);
      }
      if (isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length; i++) {
          if (event.isPropagationStopped()) {
            break;
          }
          if (dispatchListeners[i](event, dispatchInstances[i])) {
            return dispatchInstances[i];
          }
        }
      } else if (dispatchListeners) {
        if (dispatchListeners(event, dispatchInstances)) {
          return dispatchInstances;
        }
      }
      return null;
    }
    function executeDispatchesInOrderStopAtTrue(event) {
      var ret = executeDispatchesInOrderStopAtTrueImpl(event);
      event._dispatchInstances = null;
      event._dispatchListeners = null;
      return ret;
    }
    function executeDirectDispatch(event) {
      {
        validateEventDispatches(event);
      }
      var dispatchListener = event._dispatchListeners;
      var dispatchInstance = event._dispatchInstances;
      if (isArray(dispatchListener)) {
        throw new Error("executeDirectDispatch(...): Invalid `event`.");
      }
      event.currentTarget = dispatchListener ? getNodeFromInstance(dispatchInstance) : null;
      var res = dispatchListener ? dispatchListener(event) : null;
      event.currentTarget = null;
      event._dispatchListeners = null;
      event._dispatchInstances = null;
      return res;
    }
    function hasDispatches(event) {
      return !!event._dispatchListeners;
    }
    var assign = Object.assign;
    var EVENT_POOL_SIZE = 10;
    var EventInterface = {
      type: null,
      target: null,
      currentTarget: function currentTarget() {
        return null;
      },
      eventPhase: null,
      bubbles: null,
      cancelable: null,
      timeStamp: function timeStamp(event) {
        return event.timeStamp || Date.now();
      },
      defaultPrevented: null,
      isTrusted: null
    };
    function functionThatReturnsTrue() {
      return true;
    }
    function functionThatReturnsFalse() {
      return false;
    }
    function SyntheticEvent(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
      {
        delete this.nativeEvent;
        delete this.preventDefault;
        delete this.stopPropagation;
        delete this.isDefaultPrevented;
        delete this.isPropagationStopped;
      }
      this.dispatchConfig = dispatchConfig;
      this._targetInst = targetInst;
      this.nativeEvent = nativeEvent;
      this._dispatchListeners = null;
      this._dispatchInstances = null;
      var Interface = this.constructor.Interface;
      for (var propName in Interface) {
        if (!Interface.hasOwnProperty(propName)) {
          continue;
        }
        {
          delete this[propName];
        }
        var normalize = Interface[propName];
        if (normalize) {
          this[propName] = normalize(nativeEvent);
        } else {
          if (propName === "target") {
            this.target = nativeEventTarget;
          } else {
            this[propName] = nativeEvent[propName];
          }
        }
      }
      var defaultPrevented = nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;
      if (defaultPrevented) {
        this.isDefaultPrevented = functionThatReturnsTrue;
      } else {
        this.isDefaultPrevented = functionThatReturnsFalse;
      }
      this.isPropagationStopped = functionThatReturnsFalse;
      return this;
    }
    assign(SyntheticEvent.prototype, {
      preventDefault: function preventDefault() {
        this.defaultPrevented = true;
        var event = this.nativeEvent;
        if (!event) {
          return;
        }
        if (event.preventDefault) {
          event.preventDefault();
        } else if (typeof event.returnValue !== "unknown") {
          event.returnValue = false;
        }
        this.isDefaultPrevented = functionThatReturnsTrue;
      },
      stopPropagation: function stopPropagation() {
        var event = this.nativeEvent;
        if (!event) {
          return;
        }
        if (event.stopPropagation) {
          event.stopPropagation();
        } else if (typeof event.cancelBubble !== "unknown") {
          event.cancelBubble = true;
        }
        this.isPropagationStopped = functionThatReturnsTrue;
      },
      persist: function persist() {
        this.isPersistent = functionThatReturnsTrue;
      },
      isPersistent: functionThatReturnsFalse,
      destructor: function destructor() {
        var Interface = this.constructor.Interface;
        for (var propName in Interface) {
          {
            Object.defineProperty(this, propName, getPooledWarningPropertyDefinition(propName, Interface[propName]));
          }
        }
        this.dispatchConfig = null;
        this._targetInst = null;
        this.nativeEvent = null;
        this.isDefaultPrevented = functionThatReturnsFalse;
        this.isPropagationStopped = functionThatReturnsFalse;
        this._dispatchListeners = null;
        this._dispatchInstances = null;
        {
          Object.defineProperty(this, "nativeEvent", getPooledWarningPropertyDefinition("nativeEvent", null));
          Object.defineProperty(this, "isDefaultPrevented", getPooledWarningPropertyDefinition("isDefaultPrevented", functionThatReturnsFalse));
          Object.defineProperty(this, "isPropagationStopped", getPooledWarningPropertyDefinition("isPropagationStopped", functionThatReturnsFalse));
          Object.defineProperty(this, "preventDefault", getPooledWarningPropertyDefinition("preventDefault", function () {}));
          Object.defineProperty(this, "stopPropagation", getPooledWarningPropertyDefinition("stopPropagation", function () {}));
        }
      }
    });
    SyntheticEvent.Interface = EventInterface;
    SyntheticEvent.extend = function (Interface) {
      var Super = this;
      var E = function E() {};
      E.prototype = Super.prototype;
      var prototype = new E();
      function Class() {
        return Super.apply(this, arguments);
      }
      assign(prototype, Class.prototype);
      Class.prototype = prototype;
      Class.prototype.constructor = Class;
      Class.Interface = assign({}, Super.Interface, Interface);
      Class.extend = Super.extend;
      addEventPoolingTo(Class);
      return Class;
    };
    addEventPoolingTo(SyntheticEvent);
    function getPooledWarningPropertyDefinition(propName, getVal) {
      function set(val) {
        var action = isFunction ? "setting the method" : "setting the property";
        warn(action, "This is effectively a no-op");
        return val;
      }
      function get() {
        var action = isFunction ? "accessing the method" : "accessing the property";
        var result = isFunction ? "This is a no-op function" : "This is set to null";
        warn(action, result);
        return getVal;
      }
      function warn(action, result) {
        {
          error("This synthetic event is reused for performance reasons. If you're seeing this, " + "you're %s `%s` on a released/nullified synthetic event. %s. " + "If you must keep the original synthetic event around, use event.persist(). " + "See https://reactjs.org/link/event-pooling for more information.", action, propName, result);
        }
      }
      var isFunction = typeof getVal === "function";
      return {
        configurable: true,
        set: set,
        get: get
      };
    }
    function createOrGetPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
      var EventConstructor = this;
      if (EventConstructor.eventPool.length) {
        var instance = EventConstructor.eventPool.pop();
        EventConstructor.call(instance, dispatchConfig, targetInst, nativeEvent, nativeInst);
        return instance;
      }
      return new EventConstructor(dispatchConfig, targetInst, nativeEvent, nativeInst);
    }
    function releasePooledEvent(event) {
      var EventConstructor = this;
      if (!(event instanceof EventConstructor)) {
        throw new Error("Trying to release an event instance into a pool of a different type.");
      }
      event.destructor();
      if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
        EventConstructor.eventPool.push(event);
      }
    }
    function addEventPoolingTo(EventConstructor) {
      EventConstructor.getPooled = createOrGetPooledEvent;
      EventConstructor.eventPool = [];
      EventConstructor.release = releasePooledEvent;
    }
    var ResponderSyntheticEvent = SyntheticEvent.extend({
      touchHistory: function touchHistory(nativeEvent) {
        return null;
      }
    });
    var TOP_TOUCH_START = "topTouchStart";
    var TOP_TOUCH_MOVE = "topTouchMove";
    var TOP_TOUCH_END = "topTouchEnd";
    var TOP_TOUCH_CANCEL = "topTouchCancel";
    var TOP_SCROLL = "topScroll";
    var TOP_SELECTION_CHANGE = "topSelectionChange";
    function isStartish(topLevelType) {
      return topLevelType === TOP_TOUCH_START;
    }
    function isMoveish(topLevelType) {
      return topLevelType === TOP_TOUCH_MOVE;
    }
    function isEndish(topLevelType) {
      return topLevelType === TOP_TOUCH_END || topLevelType === TOP_TOUCH_CANCEL;
    }
    var startDependencies = [TOP_TOUCH_START];
    var moveDependencies = [TOP_TOUCH_MOVE];
    var endDependencies = [TOP_TOUCH_CANCEL, TOP_TOUCH_END];
    var MAX_TOUCH_BANK = 20;
    var touchBank = [];
    var touchHistory = {
      touchBank: touchBank,
      numberActiveTouches: 0,
      indexOfSingleActiveTouch: -1,
      mostRecentTimeStamp: 0
    };
    function timestampForTouch(touch) {
      return touch.timeStamp || touch.timestamp;
    }
    function createTouchRecord(touch) {
      return {
        touchActive: true,
        startPageX: touch.pageX,
        startPageY: touch.pageY,
        startTimeStamp: timestampForTouch(touch),
        currentPageX: touch.pageX,
        currentPageY: touch.pageY,
        currentTimeStamp: timestampForTouch(touch),
        previousPageX: touch.pageX,
        previousPageY: touch.pageY,
        previousTimeStamp: timestampForTouch(touch)
      };
    }
    function resetTouchRecord(touchRecord, touch) {
      touchRecord.touchActive = true;
      touchRecord.startPageX = touch.pageX;
      touchRecord.startPageY = touch.pageY;
      touchRecord.startTimeStamp = timestampForTouch(touch);
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      touchRecord.previousPageX = touch.pageX;
      touchRecord.previousPageY = touch.pageY;
      touchRecord.previousTimeStamp = timestampForTouch(touch);
    }
    function getTouchIdentifier(_ref) {
      var identifier = _ref.identifier;
      if (identifier == null) {
        throw new Error("Touch object is missing identifier.");
      }
      {
        if (identifier > MAX_TOUCH_BANK) {
          error("Touch identifier %s is greater than maximum supported %s which causes " + "performance issues backfilling array locations for all of the indices.", identifier, MAX_TOUCH_BANK);
        }
      }
      return identifier;
    }
    function recordTouchStart(touch) {
      var identifier = getTouchIdentifier(touch);
      var touchRecord = touchBank[identifier];
      if (touchRecord) {
        resetTouchRecord(touchRecord, touch);
      } else {
        touchBank[identifier] = createTouchRecord(touch);
      }
      touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
    }
    function recordTouchMove(touch) {
      var touchRecord = touchBank[getTouchIdentifier(touch)];
      if (touchRecord) {
        touchRecord.touchActive = true;
        touchRecord.previousPageX = touchRecord.currentPageX;
        touchRecord.previousPageY = touchRecord.currentPageY;
        touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
        touchRecord.currentPageX = touch.pageX;
        touchRecord.currentPageY = touch.pageY;
        touchRecord.currentTimeStamp = timestampForTouch(touch);
        touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
      } else {
        {
          warn("Cannot record touch move without a touch start.\n" + "Touch Move: %s\n" + "Touch Bank: %s", printTouch(touch), printTouchBank());
        }
      }
    }
    function recordTouchEnd(touch) {
      var touchRecord = touchBank[getTouchIdentifier(touch)];
      if (touchRecord) {
        touchRecord.touchActive = false;
        touchRecord.previousPageX = touchRecord.currentPageX;
        touchRecord.previousPageY = touchRecord.currentPageY;
        touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
        touchRecord.currentPageX = touch.pageX;
        touchRecord.currentPageY = touch.pageY;
        touchRecord.currentTimeStamp = timestampForTouch(touch);
        touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
      } else {
        {
          warn("Cannot record touch end without a touch start.\n" + "Touch End: %s\n" + "Touch Bank: %s", printTouch(touch), printTouchBank());
        }
      }
    }
    function printTouch(touch) {
      return JSON.stringify({
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY,
        timestamp: timestampForTouch(touch)
      });
    }
    function printTouchBank() {
      var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
      if (touchBank.length > MAX_TOUCH_BANK) {
        printed += " (original size: " + touchBank.length + ")";
      }
      return printed;
    }
    var instrumentationCallback;
    var ResponderTouchHistoryStore = {
      instrument: function instrument(callback) {
        instrumentationCallback = callback;
      },
      recordTouchTrack: function recordTouchTrack(topLevelType, nativeEvent) {
        if (instrumentationCallback != null) {
          instrumentationCallback(topLevelType, nativeEvent);
        }
        if (isMoveish(topLevelType)) {
          nativeEvent.changedTouches.forEach(recordTouchMove);
        } else if (isStartish(topLevelType)) {
          nativeEvent.changedTouches.forEach(recordTouchStart);
          touchHistory.numberActiveTouches = nativeEvent.touches.length;
          if (touchHistory.numberActiveTouches === 1) {
            touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier;
          }
        } else if (isEndish(topLevelType)) {
          nativeEvent.changedTouches.forEach(recordTouchEnd);
          touchHistory.numberActiveTouches = nativeEvent.touches.length;
          if (touchHistory.numberActiveTouches === 1) {
            for (var i = 0; i < touchBank.length; i++) {
              var touchTrackToCheck = touchBank[i];
              if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
                touchHistory.indexOfSingleActiveTouch = i;
                break;
              }
            }
            {
              var activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
              if (activeRecord == null || !activeRecord.touchActive) {
                error("Cannot find single active touch.");
              }
            }
          }
        }
      },
      touchHistory: touchHistory
    };
    function accumulate(current, next) {
      if (next == null) {
        throw new Error("accumulate(...): Accumulated items must not be null or undefined.");
      }
      if (current == null) {
        return next;
      }
      if (isArray(current)) {
        return current.concat(next);
      }
      if (isArray(next)) {
        return [current].concat(next);
      }
      return [current, next];
    }
    function accumulateInto(current, next) {
      if (next == null) {
        throw new Error("accumulateInto(...): Accumulated items must not be null or undefined.");
      }
      if (current == null) {
        return next;
      }
      if (isArray(current)) {
        if (isArray(next)) {
          current.push.apply(current, next);
          return current;
        }
        current.push(next);
        return current;
      }
      if (isArray(next)) {
        return [current].concat(next);
      }
      return [current, next];
    }
    function forEachAccumulated(arr, cb, scope) {
      if (Array.isArray(arr)) {
        arr.forEach(cb, scope);
      } else if (arr) {
        cb.call(scope, arr);
      }
    }
    var FunctionComponent = 0;
    var ClassComponent = 1;
    var IndeterminateComponent = 2;
    var HostRoot = 3;
    var HostPortal = 4;
    var HostComponent = 5;
    var HostText = 6;
    var Fragment = 7;
    var Mode = 8;
    var ContextConsumer = 9;
    var ContextProvider = 10;
    var ForwardRef = 11;
    var Profiler = 12;
    var SuspenseComponent = 13;
    var MemoComponent = 14;
    var SimpleMemoComponent = 15;
    var LazyComponent = 16;
    var IncompleteClassComponent = 17;
    var DehydratedFragment = 18;
    var SuspenseListComponent = 19;
    var ScopeComponent = 21;
    var OffscreenComponent = 22;
    var LegacyHiddenComponent = 23;
    var CacheComponent = 24;
    var TracingMarkerComponent = 25;
    var responderInst = null;
    var trackedTouchCount = 0;
    var changeResponder = function changeResponder(nextResponderInst, blockHostResponder) {
      var oldResponderInst = responderInst;
      responderInst = nextResponderInst;
      if (ResponderEventPlugin.GlobalResponderHandler !== null) {
        ResponderEventPlugin.GlobalResponderHandler.onChange(oldResponderInst, nextResponderInst, blockHostResponder);
      }
    };
    var eventTypes = {
      startShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onStartShouldSetResponder",
          captured: "onStartShouldSetResponderCapture"
        },
        dependencies: startDependencies
      },
      scrollShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onScrollShouldSetResponder",
          captured: "onScrollShouldSetResponderCapture"
        },
        dependencies: [TOP_SCROLL]
      },
      selectionChangeShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onSelectionChangeShouldSetResponder",
          captured: "onSelectionChangeShouldSetResponderCapture"
        },
        dependencies: [TOP_SELECTION_CHANGE]
      },
      moveShouldSetResponder: {
        phasedRegistrationNames: {
          bubbled: "onMoveShouldSetResponder",
          captured: "onMoveShouldSetResponderCapture"
        },
        dependencies: moveDependencies
      },
      responderStart: {
        registrationName: "onResponderStart",
        dependencies: startDependencies
      },
      responderMove: {
        registrationName: "onResponderMove",
        dependencies: moveDependencies
      },
      responderEnd: {
        registrationName: "onResponderEnd",
        dependencies: endDependencies
      },
      responderRelease: {
        registrationName: "onResponderRelease",
        dependencies: endDependencies
      },
      responderTerminationRequest: {
        registrationName: "onResponderTerminationRequest",
        dependencies: []
      },
      responderGrant: {
        registrationName: "onResponderGrant",
        dependencies: []
      },
      responderReject: {
        registrationName: "onResponderReject",
        dependencies: []
      },
      responderTerminate: {
        registrationName: "onResponderTerminate",
        dependencies: []
      }
    };
    function getParent(inst) {
      do {
        inst = inst.return;
      } while (inst && inst.tag !== HostComponent);
      if (inst) {
        return inst;
      }
      return null;
    }
    function getLowestCommonAncestor(instA, instB) {
      var depthA = 0;
      for (var tempA = instA; tempA; tempA = getParent(tempA)) {
        depthA++;
      }
      var depthB = 0;
      for (var tempB = instB; tempB; tempB = getParent(tempB)) {
        depthB++;
      }
      while (depthA - depthB > 0) {
        instA = getParent(instA);
        depthA--;
      }
      while (depthB - depthA > 0) {
        instB = getParent(instB);
        depthB--;
      }
      var depth = depthA;
      while (depth--) {
        if (instA === instB || instA === instB.alternate) {
          return instA;
        }
        instA = getParent(instA);
        instB = getParent(instB);
      }
      return null;
    }
    function isAncestor(instA, instB) {
      while (instB) {
        if (instA === instB || instA === instB.alternate) {
          return true;
        }
        instB = getParent(instB);
      }
      return false;
    }
    function traverseTwoPhase(inst, fn, arg) {
      var path = [];
      while (inst) {
        path.push(inst);
        inst = getParent(inst);
      }
      var i;
      for (i = path.length; i-- > 0;) {
        fn(path[i], "captured", arg);
      }
      for (i = 0; i < path.length; i++) {
        fn(path[i], "bubbled", arg);
      }
    }
    function getListener(inst, registrationName) {
      var stateNode = inst.stateNode;
      if (stateNode === null) {
        return null;
      }
      var props = getFiberCurrentPropsFromNode(stateNode);
      if (props === null) {
        return null;
      }
      var listener = props[registrationName];
      if (listener && typeof listener !== "function") {
        throw new Error("Expected `" + registrationName + "` listener to be a function, instead got a value of `" + typeof listener + "` type.");
      }
      return listener;
    }
    function listenerAtPhase(inst, event, propagationPhase) {
      var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
      return getListener(inst, registrationName);
    }
    function accumulateDirectionalDispatches(inst, phase, event) {
      {
        if (!inst) {
          error("Dispatching inst must not be null");
        }
      }
      var listener = listenerAtPhase(inst, event, phase);
      if (listener) {
        event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
        event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
      }
    }
    function accumulateDispatches(inst, ignoredDirection, event) {
      if (inst && event && event.dispatchConfig.registrationName) {
        var registrationName = event.dispatchConfig.registrationName;
        var listener = getListener(inst, registrationName);
        if (listener) {
          event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
          event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
        }
      }
    }
    function accumulateDirectDispatchesSingle(event) {
      if (event && event.dispatchConfig.registrationName) {
        accumulateDispatches(event._targetInst, null, event);
      }
    }
    function accumulateDirectDispatches(events) {
      forEachAccumulated(events, accumulateDirectDispatchesSingle);
    }
    function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        var targetInst = event._targetInst;
        var parentInst = targetInst ? getParent(targetInst) : null;
        traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event);
      }
    }
    function accumulateTwoPhaseDispatchesSkipTarget(events) {
      forEachAccumulated(events, accumulateTwoPhaseDispatchesSingleSkipTarget);
    }
    function accumulateTwoPhaseDispatchesSingle(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
      }
    }
    function accumulateTwoPhaseDispatches(events) {
      forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
    }
    function setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
      var shouldSetEventType = isStartish(topLevelType) ? eventTypes.startShouldSetResponder : isMoveish(topLevelType) ? eventTypes.moveShouldSetResponder : topLevelType === TOP_SELECTION_CHANGE ? eventTypes.selectionChangeShouldSetResponder : eventTypes.scrollShouldSetResponder;
      var bubbleShouldSetFrom = !responderInst ? targetInst : getLowestCommonAncestor(responderInst, targetInst);
      var skipOverBubbleShouldSetFrom = bubbleShouldSetFrom === responderInst;
      var shouldSetEvent = ResponderSyntheticEvent.getPooled(shouldSetEventType, bubbleShouldSetFrom, nativeEvent, nativeEventTarget);
      shouldSetEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      if (skipOverBubbleShouldSetFrom) {
        accumulateTwoPhaseDispatchesSkipTarget(shouldSetEvent);
      } else {
        accumulateTwoPhaseDispatches(shouldSetEvent);
      }
      var wantsResponderInst = executeDispatchesInOrderStopAtTrue(shouldSetEvent);
      if (!shouldSetEvent.isPersistent()) {
        shouldSetEvent.constructor.release(shouldSetEvent);
      }
      if (!wantsResponderInst || wantsResponderInst === responderInst) {
        return null;
      }
      var extracted;
      var grantEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderGrant, wantsResponderInst, nativeEvent, nativeEventTarget);
      grantEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
      accumulateDirectDispatches(grantEvent);
      var blockHostResponder = executeDirectDispatch(grantEvent) === true;
      if (responderInst) {
        var terminationRequestEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderTerminationRequest, responderInst, nativeEvent, nativeEventTarget);
        terminationRequestEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
        accumulateDirectDispatches(terminationRequestEvent);
        var shouldSwitch = !hasDispatches(terminationRequestEvent) || executeDirectDispatch(terminationRequestEvent);
        if (!terminationRequestEvent.isPersistent()) {
          terminationRequestEvent.constructor.release(terminationRequestEvent);
        }
        if (shouldSwitch) {
          var terminateEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderTerminate, responderInst, nativeEvent, nativeEventTarget);
          terminateEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches(terminateEvent);
          extracted = accumulate(extracted, [grantEvent, terminateEvent]);
          changeResponder(wantsResponderInst, blockHostResponder);
        } else {
          var rejectEvent = ResponderSyntheticEvent.getPooled(eventTypes.responderReject, wantsResponderInst, nativeEvent, nativeEventTarget);
          rejectEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches(rejectEvent);
          extracted = accumulate(extracted, rejectEvent);
        }
      } else {
        extracted = accumulate(extracted, grantEvent);
        changeResponder(wantsResponderInst, blockHostResponder);
      }
      return extracted;
    }
    function canTriggerTransfer(topLevelType, topLevelInst, nativeEvent) {
      return topLevelInst && (topLevelType === TOP_SCROLL && !nativeEvent.responderIgnoreScroll || trackedTouchCount > 0 && topLevelType === TOP_SELECTION_CHANGE || isStartish(topLevelType) || isMoveish(topLevelType));
    }
    function noResponderTouches(nativeEvent) {
      var touches = nativeEvent.touches;
      if (!touches || touches.length === 0) {
        return true;
      }
      for (var i = 0; i < touches.length; i++) {
        var activeTouch = touches[i];
        var target = activeTouch.target;
        if (target !== null && target !== undefined && target !== 0) {
          var targetInst = getInstanceFromNode(target);
          if (isAncestor(responderInst, targetInst)) {
            return false;
          }
        }
      }
      return true;
    }
    var ResponderEventPlugin = {
      _getResponder: function _getResponder() {
        return responderInst;
      },
      eventTypes: eventTypes,
      extractEvents: function extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
        if (isStartish(topLevelType)) {
          trackedTouchCount += 1;
        } else if (isEndish(topLevelType)) {
          if (trackedTouchCount >= 0) {
            trackedTouchCount -= 1;
          } else {
            {
              warn("Ended a touch event which was not counted in `trackedTouchCount`.");
            }
            return null;
          }
        }
        ResponderTouchHistoryStore.recordTouchTrack(topLevelType, nativeEvent);
        var extracted = canTriggerTransfer(topLevelType, targetInst, nativeEvent) ? setResponderAndExtractTransfer(topLevelType, targetInst, nativeEvent, nativeEventTarget) : null;
        var isResponderTouchStart = responderInst && isStartish(topLevelType);
        var isResponderTouchMove = responderInst && isMoveish(topLevelType);
        var isResponderTouchEnd = responderInst && isEndish(topLevelType);
        var incrementalTouch = isResponderTouchStart ? eventTypes.responderStart : isResponderTouchMove ? eventTypes.responderMove : isResponderTouchEnd ? eventTypes.responderEnd : null;
        if (incrementalTouch) {
          var gesture = ResponderSyntheticEvent.getPooled(incrementalTouch, responderInst, nativeEvent, nativeEventTarget);
          gesture.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches(gesture);
          extracted = accumulate(extracted, gesture);
        }
        var isResponderTerminate = responderInst && topLevelType === TOP_TOUCH_CANCEL;
        var isResponderRelease = responderInst && !isResponderTerminate && isEndish(topLevelType) && noResponderTouches(nativeEvent);
        var finalTouch = isResponderTerminate ? eventTypes.responderTerminate : isResponderRelease ? eventTypes.responderRelease : null;
        if (finalTouch) {
          var finalEvent = ResponderSyntheticEvent.getPooled(finalTouch, responderInst, nativeEvent, nativeEventTarget);
          finalEvent.touchHistory = ResponderTouchHistoryStore.touchHistory;
          accumulateDirectDispatches(finalEvent);
          extracted = accumulate(extracted, finalEvent);
          changeResponder(null);
        }
        return extracted;
      },
      GlobalResponderHandler: null,
      injection: {
        injectGlobalResponderHandler: function injectGlobalResponderHandler(GlobalResponderHandler) {
          ResponderEventPlugin.GlobalResponderHandler = GlobalResponderHandler;
        }
      }
    };
    var eventPluginOrder = null;
    var namesToPlugins = {};
    function recomputePluginOrdering() {
      if (!eventPluginOrder) {
        return;
      }
      for (var pluginName in namesToPlugins) {
        var pluginModule = namesToPlugins[pluginName];
        var pluginIndex = eventPluginOrder.indexOf(pluginName);
        if (pluginIndex <= -1) {
          throw new Error("EventPluginRegistry: Cannot inject event plugins that do not exist in " + ("the plugin ordering, `" + pluginName + "`."));
        }
        if (plugins[pluginIndex]) {
          continue;
        }
        if (!pluginModule.extractEvents) {
          throw new Error("EventPluginRegistry: Event plugins must implement an `extractEvents` " + ("method, but `" + pluginName + "` does not."));
        }
        plugins[pluginIndex] = pluginModule;
        var publishedEvents = pluginModule.eventTypes;
        for (var eventName in publishedEvents) {
          if (!publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName)) {
            throw new Error("EventPluginRegistry: Failed to publish event `" + eventName + "` for plugin `" + pluginName + "`.");
          }
        }
      }
    }
    function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
        throw new Error("EventPluginRegistry: More than one plugin attempted to publish the same " + ("event name, `" + eventName + "`."));
      }
      eventNameDispatchConfigs[eventName] = dispatchConfig;
      var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
      if (phasedRegistrationNames) {
        for (var phaseName in phasedRegistrationNames) {
          if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
            var phasedRegistrationName = phasedRegistrationNames[phaseName];
            publishRegistrationName(phasedRegistrationName, pluginModule, eventName);
          }
        }
        return true;
      } else if (dispatchConfig.registrationName) {
        publishRegistrationName(dispatchConfig.registrationName, pluginModule, eventName);
        return true;
      }
      return false;
    }
    function publishRegistrationName(registrationName, pluginModule, eventName) {
      if (registrationNameModules[registrationName]) {
        throw new Error("EventPluginRegistry: More than one plugin attempted to publish the same " + ("registration name, `" + registrationName + "`."));
      }
      registrationNameModules[registrationName] = pluginModule;
      registrationNameDependencies[registrationName] = pluginModule.eventTypes[eventName].dependencies;
      {
        var lowerCasedName = registrationName.toLowerCase();
      }
    }
    var plugins = [];
    var eventNameDispatchConfigs = {};
    var registrationNameModules = {};
    var registrationNameDependencies = {};
    function injectEventPluginOrder(injectedEventPluginOrder) {
      if (eventPluginOrder) {
        throw new Error("EventPluginRegistry: Cannot inject event plugin ordering more than " + "once. You are likely trying to load more than one copy of React.");
      }
      eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
      recomputePluginOrdering();
    }
    function injectEventPluginsByName(injectedNamesToPlugins) {
      var isOrderingDirty = false;
      for (var pluginName in injectedNamesToPlugins) {
        if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
          continue;
        }
        var pluginModule = injectedNamesToPlugins[pluginName];
        if (!namesToPlugins.hasOwnProperty(pluginName) || namesToPlugins[pluginName] !== pluginModule) {
          if (namesToPlugins[pluginName]) {
            throw new Error("EventPluginRegistry: Cannot inject two different event plugins " + ("using the same name, `" + pluginName + "`."));
          }
          namesToPlugins[pluginName] = pluginModule;
          isOrderingDirty = true;
        }
      }
      if (isOrderingDirty) {
        recomputePluginOrdering();
      }
    }
    function getListeners(inst, registrationName, phase, dispatchToImperativeListeners) {
      var stateNode = inst.stateNode;
      if (stateNode === null) {
        return null;
      }
      var props = getFiberCurrentPropsFromNode(stateNode);
      if (props === null) {
        return null;
      }
      var listener = props[registrationName];
      if (listener && typeof listener !== "function") {
        throw new Error("Expected `" + registrationName + "` listener to be a function, instead got a value of `" + typeof listener + "` type.");
      }
      if (!(dispatchToImperativeListeners && stateNode.canonical && stateNode.canonical._eventListeners)) {
        return listener;
      }
      var listeners = [];
      if (listener) {
        listeners.push(listener);
      }
      var requestedPhaseIsCapture = phase === "captured";
      var mangledImperativeRegistrationName = requestedPhaseIsCapture ? "rn:" + registrationName.replace(/Capture$/, "") : "rn:" + registrationName;
      if (stateNode.canonical._eventListeners[mangledImperativeRegistrationName] && stateNode.canonical._eventListeners[mangledImperativeRegistrationName].length > 0) {
        var eventListeners = stateNode.canonical._eventListeners[mangledImperativeRegistrationName];
        eventListeners.forEach(function (listenerObj) {
          var isCaptureEvent = listenerObj.options.capture != null && listenerObj.options.capture;
          if (isCaptureEvent !== requestedPhaseIsCapture) {
            return;
          }
          var listenerFnWrapper = function listenerFnWrapper(syntheticEvent) {
            var eventInst = new ReactNativePrivateInterface.CustomEvent(mangledImperativeRegistrationName, {
              detail: syntheticEvent.nativeEvent
            });
            eventInst.isTrusted = true;
            eventInst.setSyntheticEvent(syntheticEvent);
            for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              args[_key - 1] = arguments[_key];
            }
            listenerObj.listener.apply(listenerObj, [eventInst].concat(args));
          };
          if (listenerObj.options.once) {
            listeners.push(function () {
              stateNode.canonical.removeEventListener_unstable(mangledImperativeRegistrationName, listenerObj.listener, listenerObj.capture);
              if (!listenerObj.invalidated) {
                listenerObj.invalidated = true;
                listenerObj.listener.apply(listenerObj, arguments);
              }
            });
          } else {
            listeners.push(listenerFnWrapper);
          }
        });
      }
      if (listeners.length === 0) {
        return null;
      }
      if (listeners.length === 1) {
        return listeners[0];
      }
      return listeners;
    }
    var customBubblingEventTypes = ReactNativePrivateInterface.ReactNativeViewConfigRegistry.customBubblingEventTypes,
      customDirectEventTypes = ReactNativePrivateInterface.ReactNativeViewConfigRegistry.customDirectEventTypes;
    function listenersAtPhase(inst, event, propagationPhase) {
      var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
      return getListeners(inst, registrationName, propagationPhase, true);
    }
    function accumulateListenersAndInstances(inst, event, listeners) {
      var listenersLength = listeners ? isArray(listeners) ? listeners.length : 1 : 0;
      if (listenersLength > 0) {
        event._dispatchListeners = accumulateInto(event._dispatchListeners, listeners);
        if (event._dispatchInstances == null && listenersLength === 1) {
          event._dispatchInstances = inst;
        } else {
          event._dispatchInstances = event._dispatchInstances || [];
          if (!isArray(event._dispatchInstances)) {
            event._dispatchInstances = [event._dispatchInstances];
          }
          for (var i = 0; i < listenersLength; i++) {
            event._dispatchInstances.push(inst);
          }
        }
      }
    }
    function accumulateDirectionalDispatches$1(inst, phase, event) {
      {
        if (!inst) {
          error("Dispatching inst must not be null");
        }
      }
      var listeners = listenersAtPhase(inst, event, phase);
      accumulateListenersAndInstances(inst, event, listeners);
    }
    function getParent$1(inst) {
      do {
        inst = inst.return;
      } while (inst && inst.tag !== HostComponent);
      if (inst) {
        return inst;
      }
      return null;
    }
    function traverseTwoPhase$1(inst, fn, arg, skipBubbling) {
      var path = [];
      while (inst) {
        path.push(inst);
        inst = getParent$1(inst);
      }
      var i;
      for (i = path.length; i-- > 0;) {
        fn(path[i], "captured", arg);
      }
      if (skipBubbling) {
        fn(path[0], "bubbled", arg);
      } else {
        for (i = 0; i < path.length; i++) {
          fn(path[i], "bubbled", arg);
        }
      }
    }
    function accumulateTwoPhaseDispatchesSingle$1(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase$1(event._targetInst, accumulateDirectionalDispatches$1, event, false);
      }
    }
    function accumulateTwoPhaseDispatches$1(events) {
      forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle$1);
    }
    function accumulateCapturePhaseDispatches(event) {
      if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase$1(event._targetInst, accumulateDirectionalDispatches$1, event, true);
      }
    }
    function accumulateDispatches$1(inst, ignoredDirection, event) {
      if (inst && event && event.dispatchConfig.registrationName) {
        var registrationName = event.dispatchConfig.registrationName;
        var listeners = getListeners(inst, registrationName, "bubbled", false);
        accumulateListenersAndInstances(inst, event, listeners);
      }
    }
    function accumulateDirectDispatchesSingle$1(event) {
      if (event && event.dispatchConfig.registrationName) {
        accumulateDispatches$1(event._targetInst, null, event);
      }
    }
    function accumulateDirectDispatches$1(events) {
      forEachAccumulated(events, accumulateDirectDispatchesSingle$1);
    }
    var ReactNativeBridgeEventPlugin = {
      eventTypes: {},
      extractEvents: function extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        if (targetInst == null) {
          return null;
        }
        var bubbleDispatchConfig = customBubblingEventTypes[topLevelType];
        var directDispatchConfig = customDirectEventTypes[topLevelType];
        if (!bubbleDispatchConfig && !directDispatchConfig) {
          throw new Error('Unsupported top level event type "' + topLevelType + '" dispatched');
        }
        var event = SyntheticEvent.getPooled(bubbleDispatchConfig || directDispatchConfig, targetInst, nativeEvent, nativeEventTarget);
        if (bubbleDispatchConfig) {
          var skipBubbling = event != null && event.dispatchConfig.phasedRegistrationNames != null && event.dispatchConfig.phasedRegistrationNames.skipBubbling;
          if (skipBubbling) {
            accumulateCapturePhaseDispatches(event);
          } else {
            accumulateTwoPhaseDispatches$1(event);
          }
        } else if (directDispatchConfig) {
          accumulateDirectDispatches$1(event);
        } else {
          return null;
        }
        return event;
      }
    };
    var ReactNativeEventPluginOrder = ["ResponderEventPlugin", "ReactNativeBridgeEventPlugin"];
    injectEventPluginOrder(ReactNativeEventPluginOrder);
    injectEventPluginsByName({
      ResponderEventPlugin: ResponderEventPlugin,
      ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin
    });
    var instanceCache = new Map();
    var instanceProps = new Map();
    function precacheFiberNode(hostInst, tag) {
      instanceCache.set(tag, hostInst);
    }
    function uncacheFiberNode(tag) {
      instanceCache.delete(tag);
      instanceProps.delete(tag);
    }
    function getInstanceFromTag(tag) {
      return instanceCache.get(tag) || null;
    }
    function getTagFromInstance(inst) {
      var nativeInstance = inst.stateNode;
      var tag = nativeInstance._nativeTag;
      if (tag === undefined) {
        nativeInstance = nativeInstance.canonical;
        tag = nativeInstance._nativeTag;
      }
      if (!tag) {
        throw new Error("All native instances should have a tag.");
      }
      return nativeInstance;
    }
    function getFiberCurrentPropsFromNode$1(stateNode) {
      return instanceProps.get(stateNode._nativeTag) || null;
    }
    function updateFiberProps(tag, props) {
      instanceProps.set(tag, props);
    }
    var batchedUpdatesImpl = function batchedUpdatesImpl(fn, bookkeeping) {
      return fn(bookkeeping);
    };
    var isInsideEventHandler = false;
    function batchedUpdates(fn, bookkeeping) {
      if (isInsideEventHandler) {
        return fn(bookkeeping);
      }
      isInsideEventHandler = true;
      try {
        return batchedUpdatesImpl(fn, bookkeeping);
      } finally {
        isInsideEventHandler = false;
      }
    }
    function setBatchingImplementation(_batchedUpdatesImpl, _discreteUpdatesImpl) {
      batchedUpdatesImpl = _batchedUpdatesImpl;
    }
    var eventQueue = null;
    var executeDispatchesAndRelease = function executeDispatchesAndRelease(event) {
      if (event) {
        executeDispatchesInOrder(event);
        if (!event.isPersistent()) {
          event.constructor.release(event);
        }
      }
    };
    var executeDispatchesAndReleaseTopLevel = function executeDispatchesAndReleaseTopLevel(e) {
      return executeDispatchesAndRelease(e);
    };
    function runEventsInBatch(events) {
      if (events !== null) {
        eventQueue = accumulateInto(eventQueue, events);
      }
      var processingEventQueue = eventQueue;
      eventQueue = null;
      if (!processingEventQueue) {
        return;
      }
      forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);
      if (eventQueue) {
        throw new Error("processEventQueue(): Additional events were enqueued while processing " + "an event queue. Support for this has not yet been implemented.");
      }
      rethrowCaughtError();
    }
    var EMPTY_NATIVE_EVENT = {};
    var touchSubsequence = function touchSubsequence(touches, indices) {
      var ret = [];
      for (var i = 0; i < indices.length; i++) {
        ret.push(touches[indices[i]]);
      }
      return ret;
    };
    var removeTouchesAtIndices = function removeTouchesAtIndices(touches, indices) {
      var rippedOut = [];
      var temp = touches;
      for (var i = 0; i < indices.length; i++) {
        var index = indices[i];
        rippedOut.push(touches[index]);
        temp[index] = null;
      }
      var fillAt = 0;
      for (var j = 0; j < temp.length; j++) {
        var cur = temp[j];
        if (cur !== null) {
          temp[fillAt++] = cur;
        }
      }
      temp.length = fillAt;
      return rippedOut;
    };
    function _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam) {
      var nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT;
      var inst = getInstanceFromTag(rootNodeID);
      var target = null;
      if (inst != null) {
        target = inst.stateNode;
      }
      batchedUpdates(function () {
        runExtractedPluginEventsInBatch(topLevelType, inst, nativeEvent, target);
      });
    }
    function extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
      var events = null;
      var legacyPlugins = plugins;
      for (var i = 0; i < legacyPlugins.length; i++) {
        var possiblePlugin = legacyPlugins[i];
        if (possiblePlugin) {
          var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
          if (extractedEvents) {
            events = accumulateInto(events, extractedEvents);
          }
        }
      }
      return events;
    }
    function runExtractedPluginEventsInBatch(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
      var events = extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
      runEventsInBatch(events);
    }
    function receiveEvent(rootNodeID, topLevelType, nativeEventParam) {
      _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam);
    }
    function receiveTouches(eventTopLevelType, touches, changedIndices) {
      var changedTouches = eventTopLevelType === "topTouchEnd" || eventTopLevelType === "topTouchCancel" ? removeTouchesAtIndices(touches, changedIndices) : touchSubsequence(touches, changedIndices);
      for (var jj = 0; jj < changedTouches.length; jj++) {
        var touch = changedTouches[jj];
        touch.changedTouches = changedTouches;
        touch.touches = touches;
        var nativeEvent = touch;
        var rootNodeID = null;
        var target = nativeEvent.target;
        if (target !== null && target !== undefined) {
          if (target < 1) {
            {
              error("A view is reporting that a touch occurred on tag zero.");
            }
          } else {
            rootNodeID = target;
          }
        }
        _receiveRootNodeIDEvent(rootNodeID, eventTopLevelType, nativeEvent);
      }
    }
    var ReactNativeGlobalResponderHandler = {
      onChange: function onChange(from, to, blockNativeResponder) {
        if (to !== null) {
          var tag = to.stateNode._nativeTag;
          ReactNativePrivateInterface.UIManager.setJSResponder(tag, blockNativeResponder);
        } else {
          ReactNativePrivateInterface.UIManager.clearJSResponder();
        }
      }
    };
    ReactNativePrivateInterface.RCTEventEmitter.register({
      receiveEvent: receiveEvent,
      receiveTouches: receiveTouches
    });
    setComponentTree(getFiberCurrentPropsFromNode$1, getInstanceFromTag, getTagFromInstance);
    ResponderEventPlugin.injection.injectGlobalResponderHandler(ReactNativeGlobalResponderHandler);
    function get(key) {
      return key._reactInternals;
    }
    function set(key, value) {
      key._reactInternals = value;
    }
    var enableSchedulingProfiler = false;
    var enableProfilerTimer = true;
    var enableProfilerCommitHooks = true;
    var warnAboutStringRefs = false;
    var enableSuspenseAvoidThisFallback = false;
    var enableNewReconciler = false;
    var enableLazyContextPropagation = false;
    var enableLegacyHidden = false;
    var REACT_ELEMENT_TYPE = Symbol.for("react.element");
    var REACT_PORTAL_TYPE = Symbol.for("react.portal");
    var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
    var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
    var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
    var REACT_CONTEXT_TYPE = Symbol.for("react.context");
    var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
    var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
    var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
    var REACT_MEMO_TYPE = Symbol.for("react.memo");
    var REACT_LAZY_TYPE = Symbol.for("react.lazy");
    var REACT_SCOPE_TYPE = Symbol.for("react.scope");
    var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
    var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
    var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
    var REACT_CACHE_TYPE = Symbol.for("react.cache");
    var REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker");
    var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
    var FAUX_ITERATOR_SYMBOL = "@@iterator";
    function getIteratorFn(maybeIterable) {
      if (maybeIterable === null || typeof maybeIterable !== "object") {
        return null;
      }
      var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
      if (typeof maybeIterator === "function") {
        return maybeIterator;
      }
      return null;
    }
    function getWrappedName(outerType, innerType, wrapperName) {
      var displayName = outerType.displayName;
      if (displayName) {
        return displayName;
      }
      var functionName = innerType.displayName || innerType.name || "";
      return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
    }
    function getContextName(type) {
      return type.displayName || "Context";
    }
    function getComponentNameFromType(type) {
      if (type == null) {
        return null;
      }
      {
        if (typeof type.tag === "number") {
          error("Received an unexpected object in getComponentNameFromType(). " + "This is likely a bug in React. Please file an issue.");
        }
      }
      if (typeof type === "function") {
        return type.displayName || type.name || null;
      }
      if (typeof type === "string") {
        return type;
      }
      switch (type) {
        case REACT_FRAGMENT_TYPE:
          return "Fragment";
        case REACT_PORTAL_TYPE:
          return "Portal";
        case REACT_PROFILER_TYPE:
          return "Profiler";
        case REACT_STRICT_MODE_TYPE:
          return "StrictMode";
        case REACT_SUSPENSE_TYPE:
          return "Suspense";
        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
      }
      if (typeof type === "object") {
        switch (type.$$typeof) {
          case REACT_CONTEXT_TYPE:
            var context = type;
            return getContextName(context) + ".Consumer";
          case REACT_PROVIDER_TYPE:
            var provider = type;
            return getContextName(provider._context) + ".Provider";
          case REACT_FORWARD_REF_TYPE:
            return getWrappedName(type, type.render, "ForwardRef");
          case REACT_MEMO_TYPE:
            var outerName = type.displayName || null;
            if (outerName !== null) {
              return outerName;
            }
            return getComponentNameFromType(type.type) || "Memo";
          case REACT_LAZY_TYPE:
            {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return getComponentNameFromType(init(payload));
              } catch (x) {
                return null;
              }
            }
        }
      }
      return null;
    }
    function getWrappedName$1(outerType, innerType, wrapperName) {
      var functionName = innerType.displayName || innerType.name || "";
      return outerType.displayName || (functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName);
    }
    function getContextName$1(type) {
      return type.displayName || "Context";
    }
    function getComponentNameFromFiber(fiber) {
      var tag = fiber.tag,
        type = fiber.type;
      switch (tag) {
        case CacheComponent:
          return "Cache";
        case ContextConsumer:
          var context = type;
          return getContextName$1(context) + ".Consumer";
        case ContextProvider:
          var provider = type;
          return getContextName$1(provider._context) + ".Provider";
        case DehydratedFragment:
          return "DehydratedFragment";
        case ForwardRef:
          return getWrappedName$1(type, type.render, "ForwardRef");
        case Fragment:
          return "Fragment";
        case HostComponent:
          return type;
        case HostPortal:
          return "Portal";
        case HostRoot:
          return "Root";
        case HostText:
          return "Text";
        case LazyComponent:
          return getComponentNameFromType(type);
        case Mode:
          if (type === REACT_STRICT_MODE_TYPE) {
            return "StrictMode";
          }
          return "Mode";
        case OffscreenComponent:
          return "Offscreen";
        case Profiler:
          return "Profiler";
        case ScopeComponent:
          return "Scope";
        case SuspenseComponent:
          return "Suspense";
        case SuspenseListComponent:
          return "SuspenseList";
        case TracingMarkerComponent:
          return "TracingMarker";
        case ClassComponent:
        case FunctionComponent:
        case IncompleteClassComponent:
        case IndeterminateComponent:
        case MemoComponent:
        case SimpleMemoComponent:
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          break;
      }
      return null;
    }
    var NoFlags = 0;
    var PerformedWork = 1;
    var Placement = 2;
    var Update = 4;
    var ChildDeletion = 16;
    var ContentReset = 32;
    var Callback = 64;
    var DidCapture = 128;
    var ForceClientRender = 256;
    var Ref = 512;
    var Snapshot = 1024;
    var Passive = 2048;
    var Hydrating = 4096;
    var Visibility = 8192;
    var StoreConsistency = 16384;
    var LifecycleEffectMask = Passive | Update | Callback | Ref | Snapshot | StoreConsistency;
    var HostEffectMask = 32767;
    var Incomplete = 32768;
    var ShouldCapture = 65536;
    var ForceUpdateForLegacySuspense = 131072;
    var Forked = 1048576;
    var RefStatic = 2097152;
    var LayoutStatic = 4194304;
    var PassiveStatic = 8388608;
    var BeforeMutationMask = Update | Snapshot | 0;
    var MutationMask = Placement | Update | ChildDeletion | ContentReset | Ref | Hydrating | Visibility;
    var LayoutMask = Update | Callback | Ref | Visibility;
    var PassiveMask = Passive | ChildDeletion;
    var StaticMask = LayoutStatic | PassiveStatic | RefStatic;
    var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
    function getNearestMountedFiber(fiber) {
      var node = fiber;
      var nearestMounted = fiber;
      if (!fiber.alternate) {
        var nextNode = node;
        do {
          node = nextNode;
          if ((node.flags & (Placement | Hydrating)) !== NoFlags) {
            nearestMounted = node.return;
          }
          nextNode = node.return;
        } while (nextNode);
      } else {
        while (node.return) {
          node = node.return;
        }
      }
      if (node.tag === HostRoot) {
        return nearestMounted;
      }
      return null;
    }
    function isFiberMounted(fiber) {
      return getNearestMountedFiber(fiber) === fiber;
    }
    function isMounted(component) {
      {
        var owner = ReactCurrentOwner.current;
        if (owner !== null && owner.tag === ClassComponent) {
          var ownerFiber = owner;
          var instance = ownerFiber.stateNode;
          if (!instance._warnedAboutRefsInRender) {
            error("%s is accessing isMounted inside its render() function. " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", getComponentNameFromFiber(ownerFiber) || "A component");
          }
          instance._warnedAboutRefsInRender = true;
        }
      }
      var fiber = get(component);
      if (!fiber) {
        return false;
      }
      return getNearestMountedFiber(fiber) === fiber;
    }
    function assertIsMounted(fiber) {
      if (getNearestMountedFiber(fiber) !== fiber) {
        throw new Error("Unable to find node on an unmounted component.");
      }
    }
    function findCurrentFiberUsingSlowPath(fiber) {
      var alternate = fiber.alternate;
      if (!alternate) {
        var nearestMounted = getNearestMountedFiber(fiber);
        if (nearestMounted === null) {
          throw new Error("Unable to find node on an unmounted component.");
        }
        if (nearestMounted !== fiber) {
          return null;
        }
        return fiber;
      }
      var a = fiber;
      var b = alternate;
      while (true) {
        var parentA = a.return;
        if (parentA === null) {
          break;
        }
        var parentB = parentA.alternate;
        if (parentB === null) {
          var nextParent = parentA.return;
          if (nextParent !== null) {
            a = b = nextParent;
            continue;
          }
          break;
        }
        if (parentA.child === parentB.child) {
          var child = parentA.child;
          while (child) {
            if (child === a) {
              assertIsMounted(parentA);
              return fiber;
            }
            if (child === b) {
              assertIsMounted(parentA);
              return alternate;
            }
            child = child.sibling;
          }
          throw new Error("Unable to find node on an unmounted component.");
        }
        if (a.return !== b.return) {
          a = parentA;
          b = parentB;
        } else {
          var didFindChild = false;
          var _child = parentA.child;
          while (_child) {
            if (_child === a) {
              didFindChild = true;
              a = parentA;
              b = parentB;
              break;
            }
            if (_child === b) {
              didFindChild = true;
              b = parentA;
              a = parentB;
              break;
            }
            _child = _child.sibling;
          }
          if (!didFindChild) {
            _child = parentB.child;
            while (_child) {
              if (_child === a) {
                didFindChild = true;
                a = parentB;
                b = parentA;
                break;
              }
              if (_child === b) {
                didFindChild = true;
                b = parentB;
                a = parentA;
                break;
              }
              _child = _child.sibling;
            }
            if (!didFindChild) {
              throw new Error("Child was not found in either parent set. This indicates a bug " + "in React related to the return pointer. Please file an issue.");
            }
          }
        }
        if (a.alternate !== b) {
          throw new Error("Return fibers should always be each others' alternates. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
      }
      if (a.tag !== HostRoot) {
        throw new Error("Unable to find node on an unmounted component.");
      }
      if (a.stateNode.current === a) {
        return fiber;
      }
      return alternate;
    }
    function findCurrentHostFiber(parent) {
      var currentParent = findCurrentFiberUsingSlowPath(parent);
      return currentParent !== null ? findCurrentHostFiberImpl(currentParent) : null;
    }
    function findCurrentHostFiberImpl(node) {
      if (node.tag === HostComponent || node.tag === HostText) {
        return node;
      }
      var child = node.child;
      while (child !== null) {
        var match = findCurrentHostFiberImpl(child);
        if (match !== null) {
          return match;
        }
        child = child.sibling;
      }
      return null;
    }
    var emptyObject = {};
    var removedKeys = null;
    var removedKeyCount = 0;
    var deepDifferOptions = {
      unsafelyIgnoreFunctions: true
    };
    function defaultDiffer(prevProp, nextProp) {
      if (typeof nextProp !== "object" || nextProp === null) {
        return true;
      } else {
        return ReactNativePrivateInterface.deepDiffer(prevProp, nextProp, deepDifferOptions);
      }
    }
    function restoreDeletedValuesInNestedArray(updatePayload, node, validAttributes) {
      if (isArray(node)) {
        var i = node.length;
        while (i-- && removedKeyCount > 0) {
          restoreDeletedValuesInNestedArray(updatePayload, node[i], validAttributes);
        }
      } else if (node && removedKeyCount > 0) {
        var obj = node;
        for (var propKey in removedKeys) {
          if (!removedKeys[propKey]) {
            continue;
          }
          var nextProp = obj[propKey];
          if (nextProp === undefined) {
            continue;
          }
          var attributeConfig = validAttributes[propKey];
          if (!attributeConfig) {
            continue;
          }
          if (typeof nextProp === "function") {
            nextProp = true;
          }
          if (typeof nextProp === "undefined") {
            nextProp = null;
          }
          if (typeof attributeConfig !== "object") {
            updatePayload[propKey] = nextProp;
          } else if (typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
            var nextValue = typeof attributeConfig.process === "function" ? attributeConfig.process(nextProp) : nextProp;
            updatePayload[propKey] = nextValue;
          }
          removedKeys[propKey] = false;
          removedKeyCount--;
        }
      }
    }
    function diffNestedArrayProperty(updatePayload, prevArray, nextArray, validAttributes) {
      var minLength = prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
      var i;
      for (i = 0; i < minLength; i++) {
        updatePayload = diffNestedProperty(updatePayload, prevArray[i], nextArray[i], validAttributes);
      }
      for (; i < prevArray.length; i++) {
        updatePayload = clearNestedProperty(updatePayload, prevArray[i], validAttributes);
      }
      for (; i < nextArray.length; i++) {
        updatePayload = addNestedProperty(updatePayload, nextArray[i], validAttributes);
      }
      return updatePayload;
    }
    function diffNestedProperty(updatePayload, prevProp, nextProp, validAttributes) {
      if (!updatePayload && prevProp === nextProp) {
        return updatePayload;
      }
      if (!prevProp || !nextProp) {
        if (nextProp) {
          return addNestedProperty(updatePayload, nextProp, validAttributes);
        }
        if (prevProp) {
          return clearNestedProperty(updatePayload, prevProp, validAttributes);
        }
        return updatePayload;
      }
      if (!isArray(prevProp) && !isArray(nextProp)) {
        return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
      }
      if (isArray(prevProp) && isArray(nextProp)) {
        return diffNestedArrayProperty(updatePayload, prevProp, nextProp, validAttributes);
      }
      if (isArray(prevProp)) {
        return diffProperties(updatePayload, ReactNativePrivateInterface.flattenStyle(prevProp), nextProp, validAttributes);
      }
      return diffProperties(updatePayload, prevProp, ReactNativePrivateInterface.flattenStyle(nextProp), validAttributes);
    }
    function addNestedProperty(updatePayload, nextProp, validAttributes) {
      if (!nextProp) {
        return updatePayload;
      }
      if (!isArray(nextProp)) {
        return addProperties(updatePayload, nextProp, validAttributes);
      }
      for (var i = 0; i < nextProp.length; i++) {
        updatePayload = addNestedProperty(updatePayload, nextProp[i], validAttributes);
      }
      return updatePayload;
    }
    function clearNestedProperty(updatePayload, prevProp, validAttributes) {
      if (!prevProp) {
        return updatePayload;
      }
      if (!isArray(prevProp)) {
        return clearProperties(updatePayload, prevProp, validAttributes);
      }
      for (var i = 0; i < prevProp.length; i++) {
        updatePayload = clearNestedProperty(updatePayload, prevProp[i], validAttributes);
      }
      return updatePayload;
    }
    function diffProperties(updatePayload, prevProps, nextProps, validAttributes) {
      var attributeConfig;
      var nextProp;
      var prevProp;
      for (var propKey in nextProps) {
        attributeConfig = validAttributes[propKey];
        if (!attributeConfig) {
          continue;
        }
        prevProp = prevProps[propKey];
        nextProp = nextProps[propKey];
        if (typeof nextProp === "function") {
          nextProp = true;
          if (typeof prevProp === "function") {
            prevProp = true;
          }
        }
        if (typeof nextProp === "undefined") {
          nextProp = null;
          if (typeof prevProp === "undefined") {
            prevProp = null;
          }
        }
        if (removedKeys) {
          removedKeys[propKey] = false;
        }
        if (updatePayload && updatePayload[propKey] !== undefined) {
          if (typeof attributeConfig !== "object") {
            updatePayload[propKey] = nextProp;
          } else if (typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
            var nextValue = typeof attributeConfig.process === "function" ? attributeConfig.process(nextProp) : nextProp;
            updatePayload[propKey] = nextValue;
          }
          continue;
        }
        if (prevProp === nextProp) {
          continue;
        }
        if (typeof attributeConfig !== "object") {
          if (defaultDiffer(prevProp, nextProp)) {
            (updatePayload || (updatePayload = {}))[propKey] = nextProp;
          }
        } else if (typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
          var shouldUpdate = prevProp === undefined || (typeof attributeConfig.diff === "function" ? attributeConfig.diff(prevProp, nextProp) : defaultDiffer(prevProp, nextProp));
          if (shouldUpdate) {
            var _nextValue = typeof attributeConfig.process === "function" ? attributeConfig.process(nextProp) : nextProp;
            (updatePayload || (updatePayload = {}))[propKey] = _nextValue;
          }
        } else {
          removedKeys = null;
          removedKeyCount = 0;
          updatePayload = diffNestedProperty(updatePayload, prevProp, nextProp, attributeConfig);
          if (removedKeyCount > 0 && updatePayload) {
            restoreDeletedValuesInNestedArray(updatePayload, nextProp, attributeConfig);
            removedKeys = null;
          }
        }
      }
      for (var _propKey in prevProps) {
        if (nextProps[_propKey] !== undefined) {
          continue;
        }
        attributeConfig = validAttributes[_propKey];
        if (!attributeConfig) {
          continue;
        }
        if (updatePayload && updatePayload[_propKey] !== undefined) {
          continue;
        }
        prevProp = prevProps[_propKey];
        if (prevProp === undefined) {
          continue;
        }
        if (typeof attributeConfig !== "object" || typeof attributeConfig.diff === "function" || typeof attributeConfig.process === "function") {
          (updatePayload || (updatePayload = {}))[_propKey] = null;
          if (!removedKeys) {
            removedKeys = {};
          }
          if (!removedKeys[_propKey]) {
            removedKeys[_propKey] = true;
            removedKeyCount++;
          }
        } else {
          updatePayload = clearNestedProperty(updatePayload, prevProp, attributeConfig);
        }
      }
      return updatePayload;
    }
    function addProperties(updatePayload, props, validAttributes) {
      return diffProperties(updatePayload, emptyObject, props, validAttributes);
    }
    function clearProperties(updatePayload, prevProps, validAttributes) {
      return diffProperties(updatePayload, prevProps, emptyObject, validAttributes);
    }
    function create(props, validAttributes) {
      return addProperties(null, props, validAttributes);
    }
    function diff(prevProps, nextProps, validAttributes) {
      return diffProperties(null, prevProps, nextProps, validAttributes);
    }
    function mountSafeCallback_NOT_REALLY_SAFE(context, callback) {
      return function () {
        if (!callback) {
          return undefined;
        }
        if (typeof context.__isMounted === "boolean") {
          if (!context.__isMounted) {
            return undefined;
          }
        }
        return callback.apply(context, arguments);
      };
    }
    function warnForStyleProps(props, validAttributes) {
      {
        for (var key in validAttributes.style) {
          if (!(validAttributes[key] || props[key] === undefined)) {
            error("You are setting the style `{ %s" + ": ... }` as a prop. You " + "should nest it in a style object. " + "E.g. `{ style: { %s" + ": ... } }`", key, key);
          }
        }
      }
    }
    var ReactNativeFiberHostComponent = function () {
      function ReactNativeFiberHostComponent(tag, viewConfig, internalInstanceHandleDEV) {
        this._nativeTag = tag;
        this._children = [];
        this.viewConfig = viewConfig;
        {
          this._internalFiberInstanceHandleDEV = internalInstanceHandleDEV;
        }
      }
      var _proto = ReactNativeFiberHostComponent.prototype;
      _proto.blur = function blur() {
        ReactNativePrivateInterface.TextInputState.blurTextInput(this);
      };
      _proto.focus = function focus() {
        ReactNativePrivateInterface.TextInputState.focusTextInput(this);
      };
      _proto.measure = function measure(callback) {
        ReactNativePrivateInterface.UIManager.measure(this._nativeTag, mountSafeCallback_NOT_REALLY_SAFE(this, callback));
      };
      _proto.measureInWindow = function measureInWindow(callback) {
        ReactNativePrivateInterface.UIManager.measureInWindow(this._nativeTag, mountSafeCallback_NOT_REALLY_SAFE(this, callback));
      };
      _proto.measureLayout = function measureLayout(relativeToNativeNode, onSuccess, onFail) {
        var relativeNode;
        if (typeof relativeToNativeNode === "number") {
          relativeNode = relativeToNativeNode;
        } else {
          var nativeNode = relativeToNativeNode;
          if (nativeNode._nativeTag) {
            relativeNode = nativeNode._nativeTag;
          }
        }
        if (relativeNode == null) {
          {
            error("Warning: ref.measureLayout must be called with a node handle or a ref to a native component.");
          }
          return;
        }
        ReactNativePrivateInterface.UIManager.measureLayout(this._nativeTag, relativeNode, mountSafeCallback_NOT_REALLY_SAFE(this, onFail), mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess));
      };
      _proto.setNativeProps = function setNativeProps(nativeProps) {
        {
          warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
        }
        var updatePayload = create(nativeProps, this.viewConfig.validAttributes);
        if (updatePayload != null) {
          ReactNativePrivateInterface.UIManager.updateView(this._nativeTag, this.viewConfig.uiViewClassName, updatePayload);
        }
      };
      return ReactNativeFiberHostComponent;
    }();
    var scheduleCallback = Scheduler.unstable_scheduleCallback;
    var cancelCallback = Scheduler.unstable_cancelCallback;
    var shouldYield = Scheduler.unstable_shouldYield;
    var requestPaint = Scheduler.unstable_requestPaint;
    var now = Scheduler.unstable_now;
    var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    var NormalPriority = Scheduler.unstable_NormalPriority;
    var IdlePriority = Scheduler.unstable_IdlePriority;
    var rendererID = null;
    var injectedHook = null;
    var hasLoggedError = false;
    var isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined";
    function injectInternals(internals) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
        return false;
      }
      var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.isDisabled) {
        return true;
      }
      if (!hook.supportsFiber) {
        {
          error("The installed version of React DevTools is too old and will not work " + "with the current version of React. Please update React DevTools. " + "https://reactjs.org/link/react-devtools");
        }
        return true;
      }
      try {
        if (enableSchedulingProfiler) {
          internals = assign({}, internals, {
            getLaneLabelMap: getLaneLabelMap,
            injectProfilingHooks: injectProfilingHooks
          });
        }
        rendererID = hook.inject(internals);
        injectedHook = hook;
      } catch (err) {
        {
          error("React instrumentation encountered an error: %s.", err);
        }
      }
      if (hook.checkDCE) {
        return true;
      } else {
        return false;
      }
    }
    function onScheduleRoot(root, children) {
      {
        if (injectedHook && typeof injectedHook.onScheduleFiberRoot === "function") {
          try {
            injectedHook.onScheduleFiberRoot(rendererID, root, children);
          } catch (err) {
            if (!hasLoggedError) {
              hasLoggedError = true;
              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function onCommitRoot(root, eventPriority) {
      if (injectedHook && typeof injectedHook.onCommitFiberRoot === "function") {
        try {
          var didError = (root.current.flags & DidCapture) === DidCapture;
          if (enableProfilerTimer) {
            var schedulerPriority;
            switch (eventPriority) {
              case DiscreteEventPriority:
                schedulerPriority = ImmediatePriority;
                break;
              case ContinuousEventPriority:
                schedulerPriority = UserBlockingPriority;
                break;
              case DefaultEventPriority:
                schedulerPriority = NormalPriority;
                break;
              case IdleEventPriority:
                schedulerPriority = IdlePriority;
                break;
              default:
                schedulerPriority = NormalPriority;
                break;
            }
            injectedHook.onCommitFiberRoot(rendererID, root, schedulerPriority, didError);
          } else {
            injectedHook.onCommitFiberRoot(rendererID, root, undefined, didError);
          }
        } catch (err) {
          {
            if (!hasLoggedError) {
              hasLoggedError = true;
              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function onPostCommitRoot(root) {
      if (injectedHook && typeof injectedHook.onPostCommitFiberRoot === "function") {
        try {
          injectedHook.onPostCommitFiberRoot(rendererID, root);
        } catch (err) {
          {
            if (!hasLoggedError) {
              hasLoggedError = true;
              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function onCommitUnmount(fiber) {
      if (injectedHook && typeof injectedHook.onCommitFiberUnmount === "function") {
        try {
          injectedHook.onCommitFiberUnmount(rendererID, fiber);
        } catch (err) {
          {
            if (!hasLoggedError) {
              hasLoggedError = true;
              error("React instrumentation encountered an error: %s", err);
            }
          }
        }
      }
    }
    function injectProfilingHooks(profilingHooks) {}
    function getLaneLabelMap() {
      {
        return null;
      }
    }
    function markComponentRenderStopped() {}
    function markComponentErrored(fiber, thrownValue, lanes) {}
    function markComponentSuspended(fiber, wakeable, lanes) {}
    var NoMode = 0;
    var ConcurrentMode = 1;
    var ProfileMode = 2;
    var StrictLegacyMode = 8;
    var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
    var log = Math.log;
    var LN2 = Math.LN2;
    function clz32Fallback(x) {
      var asUint = x >>> 0;
      if (asUint === 0) {
        return 32;
      }
      return 31 - (log(asUint) / LN2 | 0) | 0;
    }
    var TotalLanes = 31;
    var NoLanes = 0;
    var NoLane = 0;
    var SyncLane = 1;
    var InputContinuousHydrationLane = 2;
    var InputContinuousLane = 4;
    var DefaultHydrationLane = 8;
    var DefaultLane = 16;
    var TransitionHydrationLane = 32;
    var TransitionLanes = 4194240;
    var TransitionLane1 = 64;
    var TransitionLane2 = 128;
    var TransitionLane3 = 256;
    var TransitionLane4 = 512;
    var TransitionLane5 = 1024;
    var TransitionLane6 = 2048;
    var TransitionLane7 = 4096;
    var TransitionLane8 = 8192;
    var TransitionLane9 = 16384;
    var TransitionLane10 = 32768;
    var TransitionLane11 = 65536;
    var TransitionLane12 = 131072;
    var TransitionLane13 = 262144;
    var TransitionLane14 = 524288;
    var TransitionLane15 = 1048576;
    var TransitionLane16 = 2097152;
    var RetryLanes = 130023424;
    var RetryLane1 = 4194304;
    var RetryLane2 = 8388608;
    var RetryLane3 = 16777216;
    var RetryLane4 = 33554432;
    var RetryLane5 = 67108864;
    var SomeRetryLane = RetryLane1;
    var SelectiveHydrationLane = 134217728;
    var NonIdleLanes = 268435455;
    var IdleHydrationLane = 268435456;
    var IdleLane = 536870912;
    var OffscreenLane = 1073741824;
    var NoTimestamp = -1;
    var nextTransitionLane = TransitionLane1;
    var nextRetryLane = RetryLane1;
    function getHighestPriorityLanes(lanes) {
      switch (getHighestPriorityLane(lanes)) {
        case SyncLane:
          return SyncLane;
        case InputContinuousHydrationLane:
          return InputContinuousHydrationLane;
        case InputContinuousLane:
          return InputContinuousLane;
        case DefaultHydrationLane:
          return DefaultHydrationLane;
        case DefaultLane:
          return DefaultLane;
        case TransitionHydrationLane:
          return TransitionHydrationLane;
        case TransitionLane1:
        case TransitionLane2:
        case TransitionLane3:
        case TransitionLane4:
        case TransitionLane5:
        case TransitionLane6:
        case TransitionLane7:
        case TransitionLane8:
        case TransitionLane9:
        case TransitionLane10:
        case TransitionLane11:
        case TransitionLane12:
        case TransitionLane13:
        case TransitionLane14:
        case TransitionLane15:
        case TransitionLane16:
          return lanes & TransitionLanes;
        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
        case RetryLane5:
          return lanes & RetryLanes;
        case SelectiveHydrationLane:
          return SelectiveHydrationLane;
        case IdleHydrationLane:
          return IdleHydrationLane;
        case IdleLane:
          return IdleLane;
        case OffscreenLane:
          return OffscreenLane;
        default:
          {
            error("Should have found matching lanes. This is a bug in React.");
          }
          return lanes;
      }
    }
    function getNextLanes(root, wipLanes) {
      var pendingLanes = root.pendingLanes;
      if (pendingLanes === NoLanes) {
        return NoLanes;
      }
      var nextLanes = NoLanes;
      var suspendedLanes = root.suspendedLanes;
      var pingedLanes = root.pingedLanes;
      var nonIdlePendingLanes = pendingLanes & NonIdleLanes;
      if (nonIdlePendingLanes !== NoLanes) {
        var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
        if (nonIdleUnblockedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
        } else {
          var nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
          if (nonIdlePingedLanes !== NoLanes) {
            nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
          }
        }
      } else {
        var unblockedLanes = pendingLanes & ~suspendedLanes;
        if (unblockedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(unblockedLanes);
        } else {
          if (pingedLanes !== NoLanes) {
            nextLanes = getHighestPriorityLanes(pingedLanes);
          }
        }
      }
      if (nextLanes === NoLanes) {
        return NoLanes;
      }
      if (wipLanes !== NoLanes && wipLanes !== nextLanes && (wipLanes & suspendedLanes) === NoLanes) {
        var nextLane = getHighestPriorityLane(nextLanes);
        var wipLane = getHighestPriorityLane(wipLanes);
        if (nextLane >= wipLane || nextLane === DefaultLane && (wipLane & TransitionLanes) !== NoLanes) {
          return wipLanes;
        }
      }
      if ((nextLanes & InputContinuousLane) !== NoLanes) {
        nextLanes |= pendingLanes & DefaultLane;
      }
      var entangledLanes = root.entangledLanes;
      if (entangledLanes !== NoLanes) {
        var entanglements = root.entanglements;
        var lanes = nextLanes & entangledLanes;
        while (lanes > 0) {
          var index = pickArbitraryLaneIndex(lanes);
          var lane = 1 << index;
          nextLanes |= entanglements[index];
          lanes &= ~lane;
        }
      }
      return nextLanes;
    }
    function getMostRecentEventTime(root, lanes) {
      var eventTimes = root.eventTimes;
      var mostRecentEventTime = NoTimestamp;
      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var eventTime = eventTimes[index];
        if (eventTime > mostRecentEventTime) {
          mostRecentEventTime = eventTime;
        }
        lanes &= ~lane;
      }
      return mostRecentEventTime;
    }
    function computeExpirationTime(lane, currentTime) {
      switch (lane) {
        case SyncLane:
        case InputContinuousHydrationLane:
        case InputContinuousLane:
          return currentTime + 250;
        case DefaultHydrationLane:
        case DefaultLane:
        case TransitionHydrationLane:
        case TransitionLane1:
        case TransitionLane2:
        case TransitionLane3:
        case TransitionLane4:
        case TransitionLane5:
        case TransitionLane6:
        case TransitionLane7:
        case TransitionLane8:
        case TransitionLane9:
        case TransitionLane10:
        case TransitionLane11:
        case TransitionLane12:
        case TransitionLane13:
        case TransitionLane14:
        case TransitionLane15:
        case TransitionLane16:
          return currentTime + 5000;
        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
        case RetryLane5:
          return NoTimestamp;
        case SelectiveHydrationLane:
        case IdleHydrationLane:
        case IdleLane:
        case OffscreenLane:
          return NoTimestamp;
        default:
          {
            error("Should have found matching lanes. This is a bug in React.");
          }
          return NoTimestamp;
      }
    }
    function markStarvedLanesAsExpired(root, currentTime) {
      var pendingLanes = root.pendingLanes;
      var suspendedLanes = root.suspendedLanes;
      var pingedLanes = root.pingedLanes;
      var expirationTimes = root.expirationTimes;
      var lanes = pendingLanes;
      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        var expirationTime = expirationTimes[index];
        if (expirationTime === NoTimestamp) {
          if ((lane & suspendedLanes) === NoLanes || (lane & pingedLanes) !== NoLanes) {
            expirationTimes[index] = computeExpirationTime(lane, currentTime);
          }
        } else if (expirationTime <= currentTime) {
          root.expiredLanes |= lane;
        }
        lanes &= ~lane;
      }
    }
    function getLanesToRetrySynchronouslyOnError(root) {
      var everythingButOffscreen = root.pendingLanes & ~OffscreenLane;
      if (everythingButOffscreen !== NoLanes) {
        return everythingButOffscreen;
      }
      if (everythingButOffscreen & OffscreenLane) {
        return OffscreenLane;
      }
      return NoLanes;
    }
    function includesSyncLane(lanes) {
      return (lanes & SyncLane) !== NoLanes;
    }
    function includesNonIdleWork(lanes) {
      return (lanes & NonIdleLanes) !== NoLanes;
    }
    function includesOnlyRetries(lanes) {
      return (lanes & RetryLanes) === lanes;
    }
    function includesOnlyNonUrgentLanes(lanes) {
      var UrgentLanes = SyncLane | InputContinuousLane | DefaultLane;
      return (lanes & UrgentLanes) === NoLanes;
    }
    function includesOnlyTransitions(lanes) {
      return (lanes & TransitionLanes) === lanes;
    }
    function includesBlockingLane(root, lanes) {
      var SyncDefaultLanes = InputContinuousHydrationLane | InputContinuousLane | DefaultHydrationLane | DefaultLane;
      return (lanes & SyncDefaultLanes) !== NoLanes;
    }
    function includesExpiredLane(root, lanes) {
      return (lanes & root.expiredLanes) !== NoLanes;
    }
    function isTransitionLane(lane) {
      return (lane & TransitionLanes) !== NoLanes;
    }
    function claimNextTransitionLane() {
      var lane = nextTransitionLane;
      nextTransitionLane <<= 1;
      if ((nextTransitionLane & TransitionLanes) === NoLanes) {
        nextTransitionLane = TransitionLane1;
      }
      return lane;
    }
    function claimNextRetryLane() {
      var lane = nextRetryLane;
      nextRetryLane <<= 1;
      if ((nextRetryLane & RetryLanes) === NoLanes) {
        nextRetryLane = RetryLane1;
      }
      return lane;
    }
    function getHighestPriorityLane(lanes) {
      return lanes & -lanes;
    }
    function pickArbitraryLane(lanes) {
      return getHighestPriorityLane(lanes);
    }
    function pickArbitraryLaneIndex(lanes) {
      return 31 - clz32(lanes);
    }
    function laneToIndex(lane) {
      return pickArbitraryLaneIndex(lane);
    }
    function includesSomeLane(a, b) {
      return (a & b) !== NoLanes;
    }
    function isSubsetOfLanes(set, subset) {
      return (set & subset) === subset;
    }
    function mergeLanes(a, b) {
      return a | b;
    }
    function removeLanes(set, subset) {
      return set & ~subset;
    }
    function intersectLanes(a, b) {
      return a & b;
    }
    function laneToLanes(lane) {
      return lane;
    }
    function createLaneMap(initial) {
      var laneMap = [];
      for (var i = 0; i < TotalLanes; i++) {
        laneMap.push(initial);
      }
      return laneMap;
    }
    function markRootUpdated(root, updateLane, eventTime) {
      root.pendingLanes |= updateLane;
      if (updateLane !== IdleLane) {
        root.suspendedLanes = NoLanes;
        root.pingedLanes = NoLanes;
      }
      var eventTimes = root.eventTimes;
      var index = laneToIndex(updateLane);
      eventTimes[index] = eventTime;
    }
    function markRootSuspended(root, suspendedLanes) {
      root.suspendedLanes |= suspendedLanes;
      root.pingedLanes &= ~suspendedLanes;
      var expirationTimes = root.expirationTimes;
      var lanes = suspendedLanes;
      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        expirationTimes[index] = NoTimestamp;
        lanes &= ~lane;
      }
    }
    function markRootPinged(root, pingedLanes, eventTime) {
      root.pingedLanes |= root.suspendedLanes & pingedLanes;
    }
    function markRootFinished(root, remainingLanes) {
      var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
      root.pendingLanes = remainingLanes;
      root.suspendedLanes = NoLanes;
      root.pingedLanes = NoLanes;
      root.expiredLanes &= remainingLanes;
      root.mutableReadLanes &= remainingLanes;
      root.entangledLanes &= remainingLanes;
      var entanglements = root.entanglements;
      var eventTimes = root.eventTimes;
      var expirationTimes = root.expirationTimes;
      var lanes = noLongerPendingLanes;
      while (lanes > 0) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        entanglements[index] = NoLanes;
        eventTimes[index] = NoTimestamp;
        expirationTimes[index] = NoTimestamp;
        lanes &= ~lane;
      }
    }
    function markRootEntangled(root, entangledLanes) {
      var rootEntangledLanes = root.entangledLanes |= entangledLanes;
      var entanglements = root.entanglements;
      var lanes = rootEntangledLanes;
      while (lanes) {
        var index = pickArbitraryLaneIndex(lanes);
        var lane = 1 << index;
        if (lane & entangledLanes | entanglements[index] & entangledLanes) {
          entanglements[index] |= entangledLanes;
        }
        lanes &= ~lane;
      }
    }
    function getBumpedLaneForHydration(root, renderLanes) {
      var renderLane = getHighestPriorityLane(renderLanes);
      var lane;
      switch (renderLane) {
        case InputContinuousLane:
          lane = InputContinuousHydrationLane;
          break;
        case DefaultLane:
          lane = DefaultHydrationLane;
          break;
        case TransitionLane1:
        case TransitionLane2:
        case TransitionLane3:
        case TransitionLane4:
        case TransitionLane5:
        case TransitionLane6:
        case TransitionLane7:
        case TransitionLane8:
        case TransitionLane9:
        case TransitionLane10:
        case TransitionLane11:
        case TransitionLane12:
        case TransitionLane13:
        case TransitionLane14:
        case TransitionLane15:
        case TransitionLane16:
        case RetryLane1:
        case RetryLane2:
        case RetryLane3:
        case RetryLane4:
        case RetryLane5:
          lane = TransitionHydrationLane;
          break;
        case IdleLane:
          lane = IdleHydrationLane;
          break;
        default:
          lane = NoLane;
          break;
      }
      if ((lane & (root.suspendedLanes | renderLanes)) !== NoLane) {
        return NoLane;
      }
      return lane;
    }
    function addFiberToLanesMap(root, fiber, lanes) {
      if (!isDevToolsPresent) {
        return;
      }
      var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
      while (lanes > 0) {
        var index = laneToIndex(lanes);
        var lane = 1 << index;
        var updaters = pendingUpdatersLaneMap[index];
        updaters.add(fiber);
        lanes &= ~lane;
      }
    }
    function movePendingFibersToMemoized(root, lanes) {
      if (!isDevToolsPresent) {
        return;
      }
      var pendingUpdatersLaneMap = root.pendingUpdatersLaneMap;
      var memoizedUpdaters = root.memoizedUpdaters;
      while (lanes > 0) {
        var index = laneToIndex(lanes);
        var lane = 1 << index;
        var updaters = pendingUpdatersLaneMap[index];
        if (updaters.size > 0) {
          updaters.forEach(function (fiber) {
            var alternate = fiber.alternate;
            if (alternate === null || !memoizedUpdaters.has(alternate)) {
              memoizedUpdaters.add(fiber);
            }
          });
          updaters.clear();
        }
        lanes &= ~lane;
      }
    }
    function getTransitionsForLanes(root, lanes) {
      {
        return null;
      }
    }
    var DiscreteEventPriority = SyncLane;
    var ContinuousEventPriority = InputContinuousLane;
    var DefaultEventPriority = DefaultLane;
    var IdleEventPriority = IdleLane;
    var currentUpdatePriority = NoLane;
    function getCurrentUpdatePriority() {
      return currentUpdatePriority;
    }
    function setCurrentUpdatePriority(newPriority) {
      currentUpdatePriority = newPriority;
    }
    function higherEventPriority(a, b) {
      return a !== 0 && a < b ? a : b;
    }
    function lowerEventPriority(a, b) {
      return a === 0 || a > b ? a : b;
    }
    function isHigherEventPriority(a, b) {
      return a !== 0 && a < b;
    }
    function lanesToEventPriority(lanes) {
      var lane = getHighestPriorityLane(lanes);
      if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
        return DiscreteEventPriority;
      }
      if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
        return ContinuousEventPriority;
      }
      if (includesNonIdleWork(lane)) {
        return DefaultEventPriority;
      }
      return IdleEventPriority;
    }
    function shim() {
      throw new Error("The current renderer does not support hydration. " + "This error is likely caused by a bug in React. " + "Please file an issue.");
    }
    var isSuspenseInstancePending = shim;
    var isSuspenseInstanceFallback = shim;
    var getSuspenseInstanceFallbackErrorDetails = shim;
    var registerSuspenseInstanceRetry = shim;
    var hydrateTextInstance = shim;
    var clearSuspenseBoundary = shim;
    var clearSuspenseBoundaryFromContainer = shim;
    var errorHydratingContainer = shim;
    var getViewConfigForType = ReactNativePrivateInterface.ReactNativeViewConfigRegistry.get;
    var UPDATE_SIGNAL = {};
    {
      Object.freeze(UPDATE_SIGNAL);
    }
    var nextReactTag = 3;
    function allocateTag() {
      var tag = nextReactTag;
      if (tag % 10 === 1) {
        tag += 2;
      }
      nextReactTag = tag + 2;
      return tag;
    }
    function recursivelyUncacheFiberNode(node) {
      if (typeof node === "number") {
        uncacheFiberNode(node);
      } else {
        uncacheFiberNode(node._nativeTag);
        node._children.forEach(recursivelyUncacheFiberNode);
      }
    }
    function appendInitialChild(parentInstance, child) {
      parentInstance._children.push(child);
    }
    function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
      var tag = allocateTag();
      var viewConfig = getViewConfigForType(type);
      {
        for (var key in viewConfig.validAttributes) {
          if (props.hasOwnProperty(key)) {
            ReactNativePrivateInterface.deepFreezeAndThrowOnMutationInDev(props[key]);
          }
        }
      }
      var updatePayload = create(props, viewConfig.validAttributes);
      ReactNativePrivateInterface.UIManager.createView(tag, viewConfig.uiViewClassName, rootContainerInstance, updatePayload);
      var component = new ReactNativeFiberHostComponent(tag, viewConfig, internalInstanceHandle);
      precacheFiberNode(internalInstanceHandle, tag);
      updateFiberProps(tag, props);
      return component;
    }
    function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle) {
      if (!hostContext.isInAParentText) {
        throw new Error("Text strings must be rendered within a <Text> component.");
      }
      var tag = allocateTag();
      ReactNativePrivateInterface.UIManager.createView(tag, "RCTRawText", rootContainerInstance, {
        text: text
      });
      precacheFiberNode(internalInstanceHandle, tag);
      return tag;
    }
    function finalizeInitialChildren(parentInstance, type, props, rootContainerInstance, hostContext) {
      if (parentInstance._children.length === 0) {
        return false;
      }
      var nativeTags = parentInstance._children.map(function (child) {
        return typeof child === "number" ? child : child._nativeTag;
      });
      ReactNativePrivateInterface.UIManager.setChildren(parentInstance._nativeTag, nativeTags);
      return false;
    }
    function getRootHostContext(rootContainerInstance) {
      return {
        isInAParentText: false
      };
    }
    function getChildHostContext(parentHostContext, type, rootContainerInstance) {
      var prevIsInAParentText = parentHostContext.isInAParentText;
      var isInAParentText = type === "AndroidTextInput" || type === "RCTMultilineTextInputView" || type === "RCTSinglelineTextInputView" || type === "RCTText" || type === "RCTVirtualText";
      if (prevIsInAParentText !== isInAParentText) {
        return {
          isInAParentText: isInAParentText
        };
      } else {
        return parentHostContext;
      }
    }
    function getPublicInstance(instance) {
      return instance;
    }
    function prepareForCommit(containerInfo) {
      return null;
    }
    function prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
      return UPDATE_SIGNAL;
    }
    function resetAfterCommit(containerInfo) {}
    var scheduleTimeout = setTimeout;
    var cancelTimeout = clearTimeout;
    var noTimeout = -1;
    function shouldSetTextContent(type, props) {
      return false;
    }
    function getCurrentEventPriority() {
      return DefaultEventPriority;
    }
    function appendChild(parentInstance, child) {
      var childTag = typeof child === "number" ? child : child._nativeTag;
      var children = parentInstance._children;
      var index = children.indexOf(child);
      if (index >= 0) {
        children.splice(index, 1);
        children.push(child);
        ReactNativePrivateInterface.UIManager.manageChildren(parentInstance._nativeTag, [index], [children.length - 1], [], [], []);
      } else {
        children.push(child);
        ReactNativePrivateInterface.UIManager.manageChildren(parentInstance._nativeTag, [], [], [childTag], [children.length - 1], []);
      }
    }
    function appendChildToContainer(parentInstance, child) {
      var childTag = typeof child === "number" ? child : child._nativeTag;
      ReactNativePrivateInterface.UIManager.setChildren(parentInstance, [childTag]);
    }
    function commitTextUpdate(textInstance, oldText, newText) {
      ReactNativePrivateInterface.UIManager.updateView(textInstance, "RCTRawText", {
        text: newText
      });
    }
    function commitUpdate(instance, updatePayloadTODO, type, oldProps, newProps, internalInstanceHandle) {
      var viewConfig = instance.viewConfig;
      updateFiberProps(instance._nativeTag, newProps);
      var updatePayload = diff(oldProps, newProps, viewConfig.validAttributes);
      if (updatePayload != null) {
        ReactNativePrivateInterface.UIManager.updateView(instance._nativeTag, viewConfig.uiViewClassName, updatePayload);
      }
    }
    function insertBefore(parentInstance, child, beforeChild) {
      var children = parentInstance._children;
      var index = children.indexOf(child);
      if (index >= 0) {
        children.splice(index, 1);
        var beforeChildIndex = children.indexOf(beforeChild);
        children.splice(beforeChildIndex, 0, child);
        ReactNativePrivateInterface.UIManager.manageChildren(parentInstance._nativeTag, [index], [beforeChildIndex], [], [], []);
      } else {
        var _beforeChildIndex = children.indexOf(beforeChild);
        children.splice(_beforeChildIndex, 0, child);
        var childTag = typeof child === "number" ? child : child._nativeTag;
        ReactNativePrivateInterface.UIManager.manageChildren(parentInstance._nativeTag, [], [], [childTag], [_beforeChildIndex], []);
      }
    }
    function insertInContainerBefore(parentInstance, child, beforeChild) {
      if (typeof parentInstance === "number") {
        throw new Error("Container does not support insertBefore operation");
      }
    }
    function removeChild(parentInstance, child) {
      recursivelyUncacheFiberNode(child);
      var children = parentInstance._children;
      var index = children.indexOf(child);
      children.splice(index, 1);
      ReactNativePrivateInterface.UIManager.manageChildren(parentInstance._nativeTag, [], [], [], [], [index]);
    }
    function removeChildFromContainer(parentInstance, child) {
      recursivelyUncacheFiberNode(child);
      ReactNativePrivateInterface.UIManager.manageChildren(parentInstance, [], [], [], [], [0]);
    }
    function resetTextContent(instance) {}
    function hideInstance(instance) {
      var viewConfig = instance.viewConfig;
      var updatePayload = create({
        style: {
          display: "none"
        }
      }, viewConfig.validAttributes);
      ReactNativePrivateInterface.UIManager.updateView(instance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    }
    function hideTextInstance(textInstance) {
      throw new Error("Not yet implemented.");
    }
    function unhideInstance(instance, props) {
      var viewConfig = instance.viewConfig;
      var updatePayload = diff(assign({}, props, {
        style: [props.style, {
          display: "none"
        }]
      }), props, viewConfig.validAttributes);
      ReactNativePrivateInterface.UIManager.updateView(instance._nativeTag, viewConfig.uiViewClassName, updatePayload);
    }
    function clearContainer(container) {}
    function unhideTextInstance(textInstance, text) {
      throw new Error("Not yet implemented.");
    }
    function preparePortalMount(portalInstance) {}
    var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
    function describeBuiltInComponentFrame(name, source, ownerFn) {
      {
        var ownerName = null;
        if (ownerFn) {
          ownerName = ownerFn.displayName || ownerFn.name || null;
        }
        return describeComponentFrame(name, source, ownerName);
      }
    }
    var componentFrameCache;
    {
      var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
      componentFrameCache = new PossiblyWeakMap();
    }
    var BEFORE_SLASH_RE = /^(.*)[\\\/]/;
    function describeComponentFrame(name, source, ownerName) {
      var sourceInfo = "";
      if (source) {
        var path = source.fileName;
        var fileName = path.replace(BEFORE_SLASH_RE, "");
        if (/^index\./.test(fileName)) {
          var match = path.match(BEFORE_SLASH_RE);
          if (match) {
            var pathBeforeSlash = match[1];
            if (pathBeforeSlash) {
              var folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, "");
              fileName = folderName + "/" + fileName;
            }
          }
        }
        sourceInfo = " (at " + fileName + ":" + source.lineNumber + ")";
      } else if (ownerName) {
        sourceInfo = " (created by " + ownerName + ")";
      }
      return "\n    in " + (name || "Unknown") + sourceInfo;
    }
    function describeClassComponentFrame(ctor, source, ownerFn) {
      {
        return describeFunctionComponentFrame(ctor, source, ownerFn);
      }
    }
    function describeFunctionComponentFrame(fn, source, ownerFn) {
      {
        if (!fn) {
          return "";
        }
        var name = fn.displayName || fn.name || null;
        var ownerName = null;
        if (ownerFn) {
          ownerName = ownerFn.displayName || ownerFn.name || null;
        }
        return describeComponentFrame(name, source, ownerName);
      }
    }
    function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
      if (type == null) {
        return "";
      }
      if (typeof type === "function") {
        {
          return describeFunctionComponentFrame(type, source, ownerFn);
        }
      }
      if (typeof type === "string") {
        return describeBuiltInComponentFrame(type, source, ownerFn);
      }
      switch (type) {
        case REACT_SUSPENSE_TYPE:
          return describeBuiltInComponentFrame("Suspense", source, ownerFn);
        case REACT_SUSPENSE_LIST_TYPE:
          return describeBuiltInComponentFrame("SuspenseList", source, ownerFn);
      }
      if (typeof type === "object") {
        switch (type.$$typeof) {
          case REACT_FORWARD_REF_TYPE:
            return describeFunctionComponentFrame(type.render, source, ownerFn);
          case REACT_MEMO_TYPE:
            return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
          case REACT_LAZY_TYPE:
            {
              var lazyComponent = type;
              var payload = lazyComponent._payload;
              var init = lazyComponent._init;
              try {
                return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
              } catch (x) {}
            }
        }
      }
      return "";
    }
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var loggedTypeFailures = {};
    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    function setCurrentlyValidatingElement(element) {
      {
        if (element) {
          var owner = element._owner;
          var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
          ReactDebugCurrentFrame.setExtraStackFrame(stack);
        } else {
          ReactDebugCurrentFrame.setExtraStackFrame(null);
        }
      }
    }
    function checkPropTypes(typeSpecs, values, location, componentName, element) {
      {
        var has = Function.call.bind(hasOwnProperty);
        for (var typeSpecName in typeSpecs) {
          if (has(typeSpecs, typeSpecName)) {
            var error$1 = void 0;
            try {
              if (typeof typeSpecs[typeSpecName] !== "function") {
                var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; " + "it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`." + "This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                err.name = "Invariant Violation";
                throw err;
              }
              error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (ex) {
              error$1 = ex;
            }
            if (error$1 && !(error$1 instanceof Error)) {
              setCurrentlyValidatingElement(element);
              error("%s: type specification of %s" + " `%s` is invalid; the type checker " + "function must return `null` or an `Error` but returned a %s. " + "You may have forgotten to pass an argument to the type checker " + "creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and " + "shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
              setCurrentlyValidatingElement(null);
            }
            if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
              loggedTypeFailures[error$1.message] = true;
              setCurrentlyValidatingElement(element);
              error("Failed %s type: %s", location, error$1.message);
              setCurrentlyValidatingElement(null);
            }
          }
        }
      }
    }
    var valueStack = [];
    var fiberStack;
    {
      fiberStack = [];
    }
    var index = -1;
    function createCursor(defaultValue) {
      return {
        current: defaultValue
      };
    }
    function pop(cursor, fiber) {
      if (index < 0) {
        {
          error("Unexpected pop.");
        }
        return;
      }
      {
        if (fiber !== fiberStack[index]) {
          error("Unexpected Fiber popped.");
        }
      }
      cursor.current = valueStack[index];
      valueStack[index] = null;
      {
        fiberStack[index] = null;
      }
      index--;
    }
    function push(cursor, value, fiber) {
      index++;
      valueStack[index] = cursor.current;
      {
        fiberStack[index] = fiber;
      }
      cursor.current = value;
    }
    var warnedAboutMissingGetChildContext;
    {
      warnedAboutMissingGetChildContext = {};
    }
    var emptyContextObject = {};
    {
      Object.freeze(emptyContextObject);
    }
    var contextStackCursor = createCursor(emptyContextObject);
    var didPerformWorkStackCursor = createCursor(false);
    var previousContext = emptyContextObject;
    function getUnmaskedContext(workInProgress, Component, didPushOwnContextIfProvider) {
      {
        if (didPushOwnContextIfProvider && isContextProvider(Component)) {
          return previousContext;
        }
        return contextStackCursor.current;
      }
    }
    function cacheContext(workInProgress, unmaskedContext, maskedContext) {
      {
        var instance = workInProgress.stateNode;
        instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
        instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
      }
    }
    function getMaskedContext(workInProgress, unmaskedContext) {
      {
        var type = workInProgress.type;
        var contextTypes = type.contextTypes;
        if (!contextTypes) {
          return emptyContextObject;
        }
        var instance = workInProgress.stateNode;
        if (instance && instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext) {
          return instance.__reactInternalMemoizedMaskedChildContext;
        }
        var context = {};
        for (var key in contextTypes) {
          context[key] = unmaskedContext[key];
        }
        {
          var name = getComponentNameFromFiber(workInProgress) || "Unknown";
          checkPropTypes(contextTypes, context, "context", name);
        }
        if (instance) {
          cacheContext(workInProgress, unmaskedContext, context);
        }
        return context;
      }
    }
    function hasContextChanged() {
      {
        return didPerformWorkStackCursor.current;
      }
    }
    function isContextProvider(type) {
      {
        var childContextTypes = type.childContextTypes;
        return childContextTypes !== null && childContextTypes !== undefined;
      }
    }
    function popContext(fiber) {
      {
        pop(didPerformWorkStackCursor, fiber);
        pop(contextStackCursor, fiber);
      }
    }
    function popTopLevelContextObject(fiber) {
      {
        pop(didPerformWorkStackCursor, fiber);
        pop(contextStackCursor, fiber);
      }
    }
    function pushTopLevelContextObject(fiber, context, didChange) {
      {
        if (contextStackCursor.current !== emptyContextObject) {
          throw new Error("Unexpected context found on stack. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        push(contextStackCursor, context, fiber);
        push(didPerformWorkStackCursor, didChange, fiber);
      }
    }
    function processChildContext(fiber, type, parentContext) {
      {
        var instance = fiber.stateNode;
        var childContextTypes = type.childContextTypes;
        if (typeof instance.getChildContext !== "function") {
          {
            var componentName = getComponentNameFromFiber(fiber) || "Unknown";
            if (!warnedAboutMissingGetChildContext[componentName]) {
              warnedAboutMissingGetChildContext[componentName] = true;
              error("%s.childContextTypes is specified but there is no getChildContext() method " + "on the instance. You can either define getChildContext() on %s or remove " + "childContextTypes from it.", componentName, componentName);
            }
          }
          return parentContext;
        }
        var childContext = instance.getChildContext();
        for (var contextKey in childContext) {
          if (!(contextKey in childContextTypes)) {
            throw new Error((getComponentNameFromFiber(fiber) || "Unknown") + '.getChildContext(): key "' + contextKey + '" is not defined in childContextTypes.');
          }
        }
        {
          var name = getComponentNameFromFiber(fiber) || "Unknown";
          checkPropTypes(childContextTypes, childContext, "child context", name);
        }
        return assign({}, parentContext, childContext);
      }
    }
    function pushContextProvider(workInProgress) {
      {
        var instance = workInProgress.stateNode;
        var memoizedMergedChildContext = instance && instance.__reactInternalMemoizedMergedChildContext || emptyContextObject;
        previousContext = contextStackCursor.current;
        push(contextStackCursor, memoizedMergedChildContext, workInProgress);
        push(didPerformWorkStackCursor, didPerformWorkStackCursor.current, workInProgress);
        return true;
      }
    }
    function invalidateContextProvider(workInProgress, type, didChange) {
      {
        var instance = workInProgress.stateNode;
        if (!instance) {
          throw new Error("Expected to have an instance by this point. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        if (didChange) {
          var mergedContext = processChildContext(workInProgress, type, previousContext);
          instance.__reactInternalMemoizedMergedChildContext = mergedContext;
          pop(didPerformWorkStackCursor, workInProgress);
          pop(contextStackCursor, workInProgress);
          push(contextStackCursor, mergedContext, workInProgress);
          push(didPerformWorkStackCursor, didChange, workInProgress);
        } else {
          pop(didPerformWorkStackCursor, workInProgress);
          push(didPerformWorkStackCursor, didChange, workInProgress);
        }
      }
    }
    function findCurrentUnmaskedContext(fiber) {
      {
        if (!isFiberMounted(fiber) || fiber.tag !== ClassComponent) {
          throw new Error("Expected subtree parent to be a mounted class component. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        var node = fiber;
        do {
          switch (node.tag) {
            case HostRoot:
              return node.stateNode.context;
            case ClassComponent:
              {
                var Component = node.type;
                if (isContextProvider(Component)) {
                  return node.stateNode.__reactInternalMemoizedMergedChildContext;
                }
                break;
              }
          }
          node = node.return;
        } while (node !== null);
        throw new Error("Found unexpected detached subtree parent. " + "This error is likely caused by a bug in React. Please file an issue.");
      }
    }
    var LegacyRoot = 0;
    var ConcurrentRoot = 1;
    function is(x, y) {
      return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
    }
    var objectIs = typeof Object.is === "function" ? Object.is : is;
    var syncQueue = null;
    var includesLegacySyncCallbacks = false;
    var isFlushingSyncQueue = false;
    function scheduleSyncCallback(callback) {
      if (syncQueue === null) {
        syncQueue = [callback];
      } else {
        syncQueue.push(callback);
      }
    }
    function scheduleLegacySyncCallback(callback) {
      includesLegacySyncCallbacks = true;
      scheduleSyncCallback(callback);
    }
    function flushSyncCallbacksOnlyInLegacyMode() {
      if (includesLegacySyncCallbacks) {
        flushSyncCallbacks();
      }
    }
    function flushSyncCallbacks() {
      if (!isFlushingSyncQueue && syncQueue !== null) {
        isFlushingSyncQueue = true;
        var i = 0;
        var previousUpdatePriority = getCurrentUpdatePriority();
        try {
          var isSync = true;
          var queue = syncQueue;
          setCurrentUpdatePriority(DiscreteEventPriority);
          for (; i < queue.length; i++) {
            var callback = queue[i];
            do {
              callback = callback(isSync);
            } while (callback !== null);
          }
          syncQueue = null;
          includesLegacySyncCallbacks = false;
        } catch (error) {
          if (syncQueue !== null) {
            syncQueue = syncQueue.slice(i + 1);
          }
          scheduleCallback(ImmediatePriority, flushSyncCallbacks);
          throw error;
        } finally {
          setCurrentUpdatePriority(previousUpdatePriority);
          isFlushingSyncQueue = false;
        }
      }
      return null;
    }
    function isRootDehydrated(root) {
      var currentState = root.current.memoizedState;
      return currentState.isDehydrated;
    }
    var forkStack = [];
    var forkStackIndex = 0;
    var treeForkProvider = null;
    var treeForkCount = 0;
    var idStack = [];
    var idStackIndex = 0;
    var treeContextProvider = null;
    var treeContextId = 1;
    var treeContextOverflow = "";
    function popTreeContext(workInProgress) {
      while (workInProgress === treeForkProvider) {
        treeForkProvider = forkStack[--forkStackIndex];
        forkStack[forkStackIndex] = null;
        treeForkCount = forkStack[--forkStackIndex];
        forkStack[forkStackIndex] = null;
      }
      while (workInProgress === treeContextProvider) {
        treeContextProvider = idStack[--idStackIndex];
        idStack[idStackIndex] = null;
        treeContextOverflow = idStack[--idStackIndex];
        idStack[idStackIndex] = null;
        treeContextId = idStack[--idStackIndex];
        idStack[idStackIndex] = null;
      }
    }
    var isHydrating = false;
    var didSuspendOrErrorDEV = false;
    var hydrationErrors = null;
    function didSuspendOrErrorWhileHydratingDEV() {
      {
        return didSuspendOrErrorDEV;
      }
    }
    function reenterHydrationStateFromDehydratedSuspenseInstance(fiber, suspenseInstance, treeContext) {
      {
        return false;
      }
    }
    function prepareToHydrateHostInstance(fiber, rootContainerInstance, hostContext) {
      {
        throw new Error("Expected prepareToHydrateHostInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
      }
    }
    function prepareToHydrateHostTextInstance(fiber) {
      {
        throw new Error("Expected prepareToHydrateHostTextInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
      }
      var shouldUpdate = hydrateTextInstance();
    }
    function prepareToHydrateHostSuspenseInstance(fiber) {
      {
        throw new Error("Expected prepareToHydrateHostSuspenseInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue.");
      }
    }
    function popHydrationState(fiber) {
      {
        return false;
      }
    }
    function upgradeHydrationErrorsToRecoverable() {
      if (hydrationErrors !== null) {
        queueRecoverableErrors(hydrationErrors);
        hydrationErrors = null;
      }
    }
    function getIsHydrating() {
      return isHydrating;
    }
    function queueHydrationError(error) {
      if (hydrationErrors === null) {
        hydrationErrors = [error];
      } else {
        hydrationErrors.push(error);
      }
    }
    var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig;
    var NoTransition = null;
    function requestCurrentTransition() {
      return ReactCurrentBatchConfig.transition;
    }
    function shallowEqual(objA, objB) {
      if (objectIs(objA, objB)) {
        return true;
      }
      if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
      }
      var keysA = Object.keys(objA);
      var keysB = Object.keys(objB);
      if (keysA.length !== keysB.length) {
        return false;
      }
      for (var i = 0; i < keysA.length; i++) {
        var currentKey = keysA[i];
        if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey])) {
          return false;
        }
      }
      return true;
    }
    function describeFiber(fiber) {
      var owner = fiber._debugOwner ? fiber._debugOwner.type : null;
      var source = fiber._debugSource;
      switch (fiber.tag) {
        case HostComponent:
          return describeBuiltInComponentFrame(fiber.type, source, owner);
        case LazyComponent:
          return describeBuiltInComponentFrame("Lazy", source, owner);
        case SuspenseComponent:
          return describeBuiltInComponentFrame("Suspense", source, owner);
        case SuspenseListComponent:
          return describeBuiltInComponentFrame("SuspenseList", source, owner);
        case FunctionComponent:
        case IndeterminateComponent:
        case SimpleMemoComponent:
          return describeFunctionComponentFrame(fiber.type, source, owner);
        case ForwardRef:
          return describeFunctionComponentFrame(fiber.type.render, source, owner);
        case ClassComponent:
          return describeClassComponentFrame(fiber.type, source, owner);
        default:
          return "";
      }
    }
    function getStackByFiberInDevAndProd(workInProgress) {
      try {
        var info = "";
        var node = workInProgress;
        do {
          info += describeFiber(node);
          node = node.return;
        } while (node);
        return info;
      } catch (x) {
        return "\nError generating stack: " + x.message + "\n" + x.stack;
      }
    }
    var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
    var current = null;
    var isRendering = false;
    function getCurrentFiberOwnerNameInDevOrNull() {
      {
        if (current === null) {
          return null;
        }
        var owner = current._debugOwner;
        if (owner !== null && typeof owner !== "undefined") {
          return getComponentNameFromFiber(owner);
        }
      }
      return null;
    }
    function getCurrentFiberStackInDev() {
      {
        if (current === null) {
          return "";
        }
        return getStackByFiberInDevAndProd(current);
      }
    }
    function resetCurrentFiber() {
      {
        ReactDebugCurrentFrame$1.getCurrentStack = null;
        current = null;
        isRendering = false;
      }
    }
    function setCurrentFiber(fiber) {
      {
        ReactDebugCurrentFrame$1.getCurrentStack = fiber === null ? null : getCurrentFiberStackInDev;
        current = fiber;
        isRendering = false;
      }
    }
    function getCurrentFiber() {
      {
        return current;
      }
    }
    function setIsRendering(rendering) {
      {
        isRendering = rendering;
      }
    }
    var ReactStrictModeWarnings = {
      recordUnsafeLifecycleWarnings: function recordUnsafeLifecycleWarnings(fiber, instance) {},
      flushPendingUnsafeLifecycleWarnings: function flushPendingUnsafeLifecycleWarnings() {},
      recordLegacyContextWarning: function recordLegacyContextWarning(fiber, instance) {},
      flushLegacyContextWarning: function flushLegacyContextWarning() {},
      discardPendingWarnings: function discardPendingWarnings() {}
    };
    {
      var findStrictRoot = function findStrictRoot(fiber) {
        var maybeStrictRoot = null;
        var node = fiber;
        while (node !== null) {
          if (node.mode & StrictLegacyMode) {
            maybeStrictRoot = node;
          }
          node = node.return;
        }
        return maybeStrictRoot;
      };
      var setToSortedString = function setToSortedString(set) {
        var array = [];
        set.forEach(function (value) {
          array.push(value);
        });
        return array.sort().join(", ");
      };
      var pendingComponentWillMountWarnings = [];
      var pendingUNSAFE_ComponentWillMountWarnings = [];
      var pendingComponentWillReceivePropsWarnings = [];
      var pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
      var pendingComponentWillUpdateWarnings = [];
      var pendingUNSAFE_ComponentWillUpdateWarnings = [];
      var didWarnAboutUnsafeLifecycles = new Set();
      ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function (fiber, instance) {
        if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
          return;
        }
        if (typeof instance.componentWillMount === "function" && instance.componentWillMount.__suppressDeprecationWarning !== true) {
          pendingComponentWillMountWarnings.push(fiber);
        }
        if (fiber.mode & StrictLegacyMode && typeof instance.UNSAFE_componentWillMount === "function") {
          pendingUNSAFE_ComponentWillMountWarnings.push(fiber);
        }
        if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
          pendingComponentWillReceivePropsWarnings.push(fiber);
        }
        if (fiber.mode & StrictLegacyMode && typeof instance.UNSAFE_componentWillReceiveProps === "function") {
          pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber);
        }
        if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
          pendingComponentWillUpdateWarnings.push(fiber);
        }
        if (fiber.mode & StrictLegacyMode && typeof instance.UNSAFE_componentWillUpdate === "function") {
          pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber);
        }
      };
      ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function () {
        var componentWillMountUniqueNames = new Set();
        if (pendingComponentWillMountWarnings.length > 0) {
          pendingComponentWillMountWarnings.forEach(function (fiber) {
            componentWillMountUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });
          pendingComponentWillMountWarnings = [];
        }
        var UNSAFE_componentWillMountUniqueNames = new Set();
        if (pendingUNSAFE_ComponentWillMountWarnings.length > 0) {
          pendingUNSAFE_ComponentWillMountWarnings.forEach(function (fiber) {
            UNSAFE_componentWillMountUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });
          pendingUNSAFE_ComponentWillMountWarnings = [];
        }
        var componentWillReceivePropsUniqueNames = new Set();
        if (pendingComponentWillReceivePropsWarnings.length > 0) {
          pendingComponentWillReceivePropsWarnings.forEach(function (fiber) {
            componentWillReceivePropsUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });
          pendingComponentWillReceivePropsWarnings = [];
        }
        var UNSAFE_componentWillReceivePropsUniqueNames = new Set();
        if (pendingUNSAFE_ComponentWillReceivePropsWarnings.length > 0) {
          pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(function (fiber) {
            UNSAFE_componentWillReceivePropsUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });
          pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
        }
        var componentWillUpdateUniqueNames = new Set();
        if (pendingComponentWillUpdateWarnings.length > 0) {
          pendingComponentWillUpdateWarnings.forEach(function (fiber) {
            componentWillUpdateUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });
          pendingComponentWillUpdateWarnings = [];
        }
        var UNSAFE_componentWillUpdateUniqueNames = new Set();
        if (pendingUNSAFE_ComponentWillUpdateWarnings.length > 0) {
          pendingUNSAFE_ComponentWillUpdateWarnings.forEach(function (fiber) {
            UNSAFE_componentWillUpdateUniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutUnsafeLifecycles.add(fiber.type);
          });
          pendingUNSAFE_ComponentWillUpdateWarnings = [];
        }
        if (UNSAFE_componentWillMountUniqueNames.size > 0) {
          var sortedNames = setToSortedString(UNSAFE_componentWillMountUniqueNames);
          error("Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" + "\nPlease update the following components: %s", sortedNames);
        }
        if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
          var _sortedNames = setToSortedString(UNSAFE_componentWillReceivePropsUniqueNames);
          error("Using UNSAFE_componentWillReceiveProps in strict mode is not recommended " + "and may indicate bugs in your code. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "* If you're updating state whenever props change, " + "refactor your code to use memoization techniques or move it to " + "static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state\n" + "\nPlease update the following components: %s", _sortedNames);
        }
        if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
          var _sortedNames2 = setToSortedString(UNSAFE_componentWillUpdateUniqueNames);
          error("Using UNSAFE_componentWillUpdate in strict mode is not recommended " + "and may indicate bugs in your code. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "\nPlease update the following components: %s", _sortedNames2);
        }
        if (componentWillMountUniqueNames.size > 0) {
          var _sortedNames3 = setToSortedString(componentWillMountUniqueNames);
          warn("componentWillMount has been renamed, and is not recommended for use. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" + "* Rename componentWillMount to UNSAFE_componentWillMount to suppress " + "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " + "To rename all deprecated lifecycles to their new names, you can run " + "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" + "\nPlease update the following components: %s", _sortedNames3);
        }
        if (componentWillReceivePropsUniqueNames.size > 0) {
          var _sortedNames4 = setToSortedString(componentWillReceivePropsUniqueNames);
          warn("componentWillReceiveProps has been renamed, and is not recommended for use. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "* If you're updating state whenever props change, refactor your " + "code to use memoization techniques or move it to " + "static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state\n" + "* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress " + "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " + "To rename all deprecated lifecycles to their new names, you can run " + "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" + "\nPlease update the following components: %s", _sortedNames4);
        }
        if (componentWillUpdateUniqueNames.size > 0) {
          var _sortedNames5 = setToSortedString(componentWillUpdateUniqueNames);
          warn("componentWillUpdate has been renamed, and is not recommended for use. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress " + "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " + "To rename all deprecated lifecycles to their new names, you can run " + "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" + "\nPlease update the following components: %s", _sortedNames5);
        }
      };
      var pendingLegacyContextWarning = new Map();
      var didWarnAboutLegacyContext = new Set();
      ReactStrictModeWarnings.recordLegacyContextWarning = function (fiber, instance) {
        var strictRoot = findStrictRoot(fiber);
        if (strictRoot === null) {
          error("Expected to find a StrictMode component in a strict mode tree. " + "This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (didWarnAboutLegacyContext.has(fiber.type)) {
          return;
        }
        var warningsForRoot = pendingLegacyContextWarning.get(strictRoot);
        if (fiber.type.contextTypes != null || fiber.type.childContextTypes != null || instance !== null && typeof instance.getChildContext === "function") {
          if (warningsForRoot === undefined) {
            warningsForRoot = [];
            pendingLegacyContextWarning.set(strictRoot, warningsForRoot);
          }
          warningsForRoot.push(fiber);
        }
      };
      ReactStrictModeWarnings.flushLegacyContextWarning = function () {
        pendingLegacyContextWarning.forEach(function (fiberArray, strictRoot) {
          if (fiberArray.length === 0) {
            return;
          }
          var firstFiber = fiberArray[0];
          var uniqueNames = new Set();
          fiberArray.forEach(function (fiber) {
            uniqueNames.add(getComponentNameFromFiber(fiber) || "Component");
            didWarnAboutLegacyContext.add(fiber.type);
          });
          var sortedNames = setToSortedString(uniqueNames);
          try {
            setCurrentFiber(firstFiber);
            error("Legacy context API has been detected within a strict-mode tree." + "\n\nThe old API will be supported in all 16.x releases, but applications " + "using it should migrate to the new version." + "\n\nPlease update the following components: %s" + "\n\nLearn more about this warning here: https://reactjs.org/link/legacy-context", sortedNames);
          } finally {
            resetCurrentFiber();
          }
        });
      };
      ReactStrictModeWarnings.discardPendingWarnings = function () {
        pendingComponentWillMountWarnings = [];
        pendingUNSAFE_ComponentWillMountWarnings = [];
        pendingComponentWillReceivePropsWarnings = [];
        pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
        pendingComponentWillUpdateWarnings = [];
        pendingUNSAFE_ComponentWillUpdateWarnings = [];
        pendingLegacyContextWarning = new Map();
      };
    }
    function typeName(value) {
      {
        var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
        var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
        return type;
      }
    }
    function willCoercionThrow(value) {
      {
        try {
          testStringCoercion(value);
          return false;
        } catch (e) {
          return true;
        }
      }
    }
    function testStringCoercion(value) {
      return "" + value;
    }
    function checkKeyStringCoercion(value) {
      {
        if (willCoercionThrow(value)) {
          error("The provided key is an unsupported type %s." + " This value must be coerced to a string before before using it here.", typeName(value));
          return testStringCoercion(value);
        }
      }
    }
    function checkPropStringCoercion(value, propName) {
      {
        if (willCoercionThrow(value)) {
          error("The provided `%s` prop is an unsupported type %s." + " This value must be coerced to a string before before using it here.", propName, typeName(value));
          return testStringCoercion(value);
        }
      }
    }
    function resolveDefaultProps(Component, baseProps) {
      if (Component && Component.defaultProps) {
        var props = assign({}, baseProps);
        var defaultProps = Component.defaultProps;
        for (var propName in defaultProps) {
          if (props[propName] === undefined) {
            props[propName] = defaultProps[propName];
          }
        }
        return props;
      }
      return baseProps;
    }
    var valueCursor = createCursor(null);
    var rendererSigil;
    {
      rendererSigil = {};
    }
    var currentlyRenderingFiber = null;
    var lastContextDependency = null;
    var lastFullyObservedContext = null;
    var isDisallowedContextReadInDEV = false;
    function resetContextDependencies() {
      currentlyRenderingFiber = null;
      lastContextDependency = null;
      lastFullyObservedContext = null;
      {
        isDisallowedContextReadInDEV = false;
      }
    }
    function enterDisallowedContextReadInDEV() {
      {
        isDisallowedContextReadInDEV = true;
      }
    }
    function exitDisallowedContextReadInDEV() {
      {
        isDisallowedContextReadInDEV = false;
      }
    }
    function pushProvider(providerFiber, context, nextValue) {
      {
        push(valueCursor, context._currentValue, providerFiber);
        context._currentValue = nextValue;
        {
          if (context._currentRenderer !== undefined && context._currentRenderer !== null && context._currentRenderer !== rendererSigil) {
            error("Detected multiple renderers concurrently rendering the " + "same context provider. This is currently unsupported.");
          }
          context._currentRenderer = rendererSigil;
        }
      }
    }
    function popProvider(context, providerFiber) {
      var currentValue = valueCursor.current;
      pop(valueCursor, providerFiber);
      {
        {
          context._currentValue = currentValue;
        }
      }
    }
    function scheduleContextWorkOnParentPath(parent, renderLanes, propagationRoot) {
      var node = parent;
      while (node !== null) {
        var alternate = node.alternate;
        if (!isSubsetOfLanes(node.childLanes, renderLanes)) {
          node.childLanes = mergeLanes(node.childLanes, renderLanes);
          if (alternate !== null) {
            alternate.childLanes = mergeLanes(alternate.childLanes, renderLanes);
          }
        } else if (alternate !== null && !isSubsetOfLanes(alternate.childLanes, renderLanes)) {
          alternate.childLanes = mergeLanes(alternate.childLanes, renderLanes);
        }
        if (node === propagationRoot) {
          break;
        }
        node = node.return;
      }
      {
        if (node !== propagationRoot) {
          error("Expected to find the propagation root when scheduling context work. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
      }
    }
    function propagateContextChange(workInProgress, context, renderLanes) {
      {
        propagateContextChange_eager(workInProgress, context, renderLanes);
      }
    }
    function propagateContextChange_eager(workInProgress, context, renderLanes) {
      var fiber = workInProgress.child;
      if (fiber !== null) {
        fiber.return = workInProgress;
      }
      while (fiber !== null) {
        var nextFiber = void 0;
        var list = fiber.dependencies;
        if (list !== null) {
          nextFiber = fiber.child;
          var dependency = list.firstContext;
          while (dependency !== null) {
            if (dependency.context === context) {
              if (fiber.tag === ClassComponent) {
                var lane = pickArbitraryLane(renderLanes);
                var update = createUpdate(NoTimestamp, lane);
                update.tag = ForceUpdate;
                var updateQueue = fiber.updateQueue;
                if (updateQueue === null) ;else {
                  var sharedQueue = updateQueue.shared;
                  var pending = sharedQueue.pending;
                  if (pending === null) {
                    update.next = update;
                  } else {
                    update.next = pending.next;
                    pending.next = update;
                  }
                  sharedQueue.pending = update;
                }
              }
              fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
              var alternate = fiber.alternate;
              if (alternate !== null) {
                alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
              }
              scheduleContextWorkOnParentPath(fiber.return, renderLanes, workInProgress);
              list.lanes = mergeLanes(list.lanes, renderLanes);
              break;
            }
            dependency = dependency.next;
          }
        } else if (fiber.tag === ContextProvider) {
          nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
        } else if (fiber.tag === DehydratedFragment) {
          var parentSuspense = fiber.return;
          if (parentSuspense === null) {
            throw new Error("We just came from a parent so we must have had a parent. This is a bug in React.");
          }
          parentSuspense.lanes = mergeLanes(parentSuspense.lanes, renderLanes);
          var _alternate = parentSuspense.alternate;
          if (_alternate !== null) {
            _alternate.lanes = mergeLanes(_alternate.lanes, renderLanes);
          }
          scheduleContextWorkOnParentPath(parentSuspense, renderLanes, workInProgress);
          nextFiber = fiber.sibling;
        } else {
          nextFiber = fiber.child;
        }
        if (nextFiber !== null) {
          nextFiber.return = fiber;
        } else {
          nextFiber = fiber;
          while (nextFiber !== null) {
            if (nextFiber === workInProgress) {
              nextFiber = null;
              break;
            }
            var sibling = nextFiber.sibling;
            if (sibling !== null) {
              sibling.return = nextFiber.return;
              nextFiber = sibling;
              break;
            }
            nextFiber = nextFiber.return;
          }
        }
        fiber = nextFiber;
      }
    }
    function prepareToReadContext(workInProgress, renderLanes) {
      currentlyRenderingFiber = workInProgress;
      lastContextDependency = null;
      lastFullyObservedContext = null;
      var dependencies = workInProgress.dependencies;
      if (dependencies !== null) {
        {
          var firstContext = dependencies.firstContext;
          if (firstContext !== null) {
            if (includesSomeLane(dependencies.lanes, renderLanes)) {
              markWorkInProgressReceivedUpdate();
            }
            dependencies.firstContext = null;
          }
        }
      }
    }
    function _readContext(context) {
      {
        if (isDisallowedContextReadInDEV) {
          error("Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo().");
        }
      }
      var value = context._currentValue;
      if (lastFullyObservedContext === context) ;else {
        var contextItem = {
          context: context,
          memoizedValue: value,
          next: null
        };
        if (lastContextDependency === null) {
          if (currentlyRenderingFiber === null) {
            throw new Error("Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo().");
          }
          lastContextDependency = contextItem;
          currentlyRenderingFiber.dependencies = {
            lanes: NoLanes,
            firstContext: contextItem
          };
        } else {
          lastContextDependency = lastContextDependency.next = contextItem;
        }
      }
      return value;
    }
    var concurrentQueues = null;
    function pushConcurrentUpdateQueue(queue) {
      if (concurrentQueues === null) {
        concurrentQueues = [queue];
      } else {
        concurrentQueues.push(queue);
      }
    }
    function finishQueueingConcurrentUpdates() {
      if (concurrentQueues !== null) {
        for (var i = 0; i < concurrentQueues.length; i++) {
          var queue = concurrentQueues[i];
          var lastInterleavedUpdate = queue.interleaved;
          if (lastInterleavedUpdate !== null) {
            queue.interleaved = null;
            var firstInterleavedUpdate = lastInterleavedUpdate.next;
            var lastPendingUpdate = queue.pending;
            if (lastPendingUpdate !== null) {
              var firstPendingUpdate = lastPendingUpdate.next;
              lastPendingUpdate.next = firstInterleavedUpdate;
              lastInterleavedUpdate.next = firstPendingUpdate;
            }
            queue.pending = lastInterleavedUpdate;
          }
        }
        concurrentQueues = null;
      }
    }
    function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
      var interleaved = queue.interleaved;
      if (interleaved === null) {
        update.next = update;
        pushConcurrentUpdateQueue(queue);
      } else {
        update.next = interleaved.next;
        interleaved.next = update;
      }
      queue.interleaved = update;
      return markUpdateLaneFromFiberToRoot(fiber, lane);
    }
    function enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update, lane) {
      var interleaved = queue.interleaved;
      if (interleaved === null) {
        update.next = update;
        pushConcurrentUpdateQueue(queue);
      } else {
        update.next = interleaved.next;
        interleaved.next = update;
      }
      queue.interleaved = update;
    }
    function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
      var interleaved = queue.interleaved;
      if (interleaved === null) {
        update.next = update;
        pushConcurrentUpdateQueue(queue);
      } else {
        update.next = interleaved.next;
        interleaved.next = update;
      }
      queue.interleaved = update;
      return markUpdateLaneFromFiberToRoot(fiber, lane);
    }
    function enqueueConcurrentRenderForLane(fiber, lane) {
      return markUpdateLaneFromFiberToRoot(fiber, lane);
    }
    var unsafe_markUpdateLaneFromFiberToRoot = markUpdateLaneFromFiberToRoot;
    function markUpdateLaneFromFiberToRoot(sourceFiber, lane) {
      sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
      var alternate = sourceFiber.alternate;
      if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, lane);
      }
      {
        if (alternate === null && (sourceFiber.flags & (Placement | Hydrating)) !== NoFlags) {
          warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
        }
      }
      var node = sourceFiber;
      var parent = sourceFiber.return;
      while (parent !== null) {
        parent.childLanes = mergeLanes(parent.childLanes, lane);
        alternate = parent.alternate;
        if (alternate !== null) {
          alternate.childLanes = mergeLanes(alternate.childLanes, lane);
        } else {
          {
            if ((parent.flags & (Placement | Hydrating)) !== NoFlags) {
              warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
            }
          }
        }
        node = parent;
        parent = parent.return;
      }
      if (node.tag === HostRoot) {
        var root = node.stateNode;
        return root;
      } else {
        return null;
      }
    }
    var UpdateState = 0;
    var ReplaceState = 1;
    var ForceUpdate = 2;
    var CaptureUpdate = 3;
    var hasForceUpdate = false;
    var didWarnUpdateInsideUpdate;
    var currentlyProcessingQueue;
    {
      didWarnUpdateInsideUpdate = false;
      currentlyProcessingQueue = null;
    }
    function initializeUpdateQueue(fiber) {
      var queue = {
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
          pending: null,
          interleaved: null,
          lanes: NoLanes
        },
        effects: null
      };
      fiber.updateQueue = queue;
    }
    function cloneUpdateQueue(current, workInProgress) {
      var queue = workInProgress.updateQueue;
      var currentQueue = current.updateQueue;
      if (queue === currentQueue) {
        var clone = {
          baseState: currentQueue.baseState,
          firstBaseUpdate: currentQueue.firstBaseUpdate,
          lastBaseUpdate: currentQueue.lastBaseUpdate,
          shared: currentQueue.shared,
          effects: currentQueue.effects
        };
        workInProgress.updateQueue = clone;
      }
    }
    function createUpdate(eventTime, lane) {
      var update = {
        eventTime: eventTime,
        lane: lane,
        tag: UpdateState,
        payload: null,
        callback: null,
        next: null
      };
      return update;
    }
    function enqueueUpdate(fiber, update, lane) {
      var updateQueue = fiber.updateQueue;
      if (updateQueue === null) {
        return null;
      }
      var sharedQueue = updateQueue.shared;
      {
        if (currentlyProcessingQueue === sharedQueue && !didWarnUpdateInsideUpdate) {
          error("An update (setState, replaceState, or forceUpdate) was scheduled " + "from inside an update function. Update functions should be pure, " + "with zero side-effects. Consider using componentDidUpdate or a " + "callback.");
          didWarnUpdateInsideUpdate = true;
        }
      }
      if (isUnsafeClassRenderPhaseUpdate()) {
        var pending = sharedQueue.pending;
        if (pending === null) {
          update.next = update;
        } else {
          update.next = pending.next;
          pending.next = update;
        }
        sharedQueue.pending = update;
        return unsafe_markUpdateLaneFromFiberToRoot(fiber, lane);
      } else {
        return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
      }
    }
    function entangleTransitions(root, fiber, lane) {
      var updateQueue = fiber.updateQueue;
      if (updateQueue === null) {
        return;
      }
      var sharedQueue = updateQueue.shared;
      if (isTransitionLane(lane)) {
        var queueLanes = sharedQueue.lanes;
        queueLanes = intersectLanes(queueLanes, root.pendingLanes);
        var newQueueLanes = mergeLanes(queueLanes, lane);
        sharedQueue.lanes = newQueueLanes;
        markRootEntangled(root, newQueueLanes);
      }
    }
    function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
      var queue = workInProgress.updateQueue;
      var current = workInProgress.alternate;
      if (current !== null) {
        var currentQueue = current.updateQueue;
        if (queue === currentQueue) {
          var newFirst = null;
          var newLast = null;
          var firstBaseUpdate = queue.firstBaseUpdate;
          if (firstBaseUpdate !== null) {
            var update = firstBaseUpdate;
            do {
              var clone = {
                eventTime: update.eventTime,
                lane: update.lane,
                tag: update.tag,
                payload: update.payload,
                callback: update.callback,
                next: null
              };
              if (newLast === null) {
                newFirst = newLast = clone;
              } else {
                newLast.next = clone;
                newLast = clone;
              }
              update = update.next;
            } while (update !== null);
            if (newLast === null) {
              newFirst = newLast = capturedUpdate;
            } else {
              newLast.next = capturedUpdate;
              newLast = capturedUpdate;
            }
          } else {
            newFirst = newLast = capturedUpdate;
          }
          queue = {
            baseState: currentQueue.baseState,
            firstBaseUpdate: newFirst,
            lastBaseUpdate: newLast,
            shared: currentQueue.shared,
            effects: currentQueue.effects
          };
          workInProgress.updateQueue = queue;
          return;
        }
      }
      var lastBaseUpdate = queue.lastBaseUpdate;
      if (lastBaseUpdate === null) {
        queue.firstBaseUpdate = capturedUpdate;
      } else {
        lastBaseUpdate.next = capturedUpdate;
      }
      queue.lastBaseUpdate = capturedUpdate;
    }
    function getStateFromUpdate(workInProgress, queue, update, prevState, nextProps, instance) {
      switch (update.tag) {
        case ReplaceState:
          {
            var payload = update.payload;
            if (typeof payload === "function") {
              {
                enterDisallowedContextReadInDEV();
              }
              var nextState = payload.call(instance, prevState, nextProps);
              {
                exitDisallowedContextReadInDEV();
              }
              return nextState;
            }
            return payload;
          }
        case CaptureUpdate:
          {
            workInProgress.flags = workInProgress.flags & ~ShouldCapture | DidCapture;
          }
        case UpdateState:
          {
            var _payload = update.payload;
            var partialState;
            if (typeof _payload === "function") {
              {
                enterDisallowedContextReadInDEV();
              }
              partialState = _payload.call(instance, prevState, nextProps);
              {
                exitDisallowedContextReadInDEV();
              }
            } else {
              partialState = _payload;
            }
            if (partialState === null || partialState === undefined) {
              return prevState;
            }
            return assign({}, prevState, partialState);
          }
        case ForceUpdate:
          {
            hasForceUpdate = true;
            return prevState;
          }
      }
      return prevState;
    }
    function processUpdateQueue(workInProgress, props, instance, renderLanes) {
      var queue = workInProgress.updateQueue;
      hasForceUpdate = false;
      {
        currentlyProcessingQueue = queue.shared;
      }
      var firstBaseUpdate = queue.firstBaseUpdate;
      var lastBaseUpdate = queue.lastBaseUpdate;
      var pendingQueue = queue.shared.pending;
      if (pendingQueue !== null) {
        queue.shared.pending = null;
        var lastPendingUpdate = pendingQueue;
        var firstPendingUpdate = lastPendingUpdate.next;
        lastPendingUpdate.next = null;
        if (lastBaseUpdate === null) {
          firstBaseUpdate = firstPendingUpdate;
        } else {
          lastBaseUpdate.next = firstPendingUpdate;
        }
        lastBaseUpdate = lastPendingUpdate;
        var current = workInProgress.alternate;
        if (current !== null) {
          var currentQueue = current.updateQueue;
          var currentLastBaseUpdate = currentQueue.lastBaseUpdate;
          if (currentLastBaseUpdate !== lastBaseUpdate) {
            if (currentLastBaseUpdate === null) {
              currentQueue.firstBaseUpdate = firstPendingUpdate;
            } else {
              currentLastBaseUpdate.next = firstPendingUpdate;
            }
            currentQueue.lastBaseUpdate = lastPendingUpdate;
          }
        }
      }
      if (firstBaseUpdate !== null) {
        var newState = queue.baseState;
        var newLanes = NoLanes;
        var newBaseState = null;
        var newFirstBaseUpdate = null;
        var newLastBaseUpdate = null;
        var update = firstBaseUpdate;
        do {
          var updateLane = update.lane;
          var updateEventTime = update.eventTime;
          if (!isSubsetOfLanes(renderLanes, updateLane)) {
            var clone = {
              eventTime: updateEventTime,
              lane: updateLane,
              tag: update.tag,
              payload: update.payload,
              callback: update.callback,
              next: null
            };
            if (newLastBaseUpdate === null) {
              newFirstBaseUpdate = newLastBaseUpdate = clone;
              newBaseState = newState;
            } else {
              newLastBaseUpdate = newLastBaseUpdate.next = clone;
            }
            newLanes = mergeLanes(newLanes, updateLane);
          } else {
            if (newLastBaseUpdate !== null) {
              var _clone = {
                eventTime: updateEventTime,
                lane: NoLane,
                tag: update.tag,
                payload: update.payload,
                callback: update.callback,
                next: null
              };
              newLastBaseUpdate = newLastBaseUpdate.next = _clone;
            }
            newState = getStateFromUpdate(workInProgress, queue, update, newState, props, instance);
            var callback = update.callback;
            if (callback !== null && update.lane !== NoLane) {
              workInProgress.flags |= Callback;
              var effects = queue.effects;
              if (effects === null) {
                queue.effects = [update];
              } else {
                effects.push(update);
              }
            }
          }
          update = update.next;
          if (update === null) {
            pendingQueue = queue.shared.pending;
            if (pendingQueue === null) {
              break;
            } else {
              var _lastPendingUpdate = pendingQueue;
              var _firstPendingUpdate = _lastPendingUpdate.next;
              _lastPendingUpdate.next = null;
              update = _firstPendingUpdate;
              queue.lastBaseUpdate = _lastPendingUpdate;
              queue.shared.pending = null;
            }
          }
        } while (true);
        if (newLastBaseUpdate === null) {
          newBaseState = newState;
        }
        queue.baseState = newBaseState;
        queue.firstBaseUpdate = newFirstBaseUpdate;
        queue.lastBaseUpdate = newLastBaseUpdate;
        var lastInterleaved = queue.shared.interleaved;
        if (lastInterleaved !== null) {
          var interleaved = lastInterleaved;
          do {
            newLanes = mergeLanes(newLanes, interleaved.lane);
            interleaved = interleaved.next;
          } while (interleaved !== lastInterleaved);
        } else if (firstBaseUpdate === null) {
          queue.shared.lanes = NoLanes;
        }
        markSkippedUpdateLanes(newLanes);
        workInProgress.lanes = newLanes;
        workInProgress.memoizedState = newState;
      }
      {
        currentlyProcessingQueue = null;
      }
    }
    function callCallback(callback, context) {
      if (typeof callback !== "function") {
        throw new Error("Invalid argument passed as callback. Expected a function. Instead " + ("received: " + callback));
      }
      callback.call(context);
    }
    function resetHasForceUpdateBeforeProcessing() {
      hasForceUpdate = false;
    }
    function checkHasForceUpdateAfterProcessing() {
      return hasForceUpdate;
    }
    function commitUpdateQueue(finishedWork, finishedQueue, instance) {
      var effects = finishedQueue.effects;
      finishedQueue.effects = null;
      if (effects !== null) {
        for (var i = 0; i < effects.length; i++) {
          var effect = effects[i];
          var callback = effect.callback;
          if (callback !== null) {
            effect.callback = null;
            callCallback(callback, instance);
          }
        }
      }
    }
    var fakeInternalInstance = {};
    var emptyRefsObject = new React.Component().refs;
    var didWarnAboutStateAssignmentForComponent;
    var didWarnAboutUninitializedState;
    var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
    var didWarnAboutLegacyLifecyclesAndDerivedState;
    var didWarnAboutUndefinedDerivedState;
    var warnOnUndefinedDerivedState;
    var warnOnInvalidCallback;
    var didWarnAboutDirectlyAssigningPropsToState;
    var didWarnAboutContextTypeAndContextTypes;
    var didWarnAboutInvalidateContextType;
    {
      didWarnAboutStateAssignmentForComponent = new Set();
      didWarnAboutUninitializedState = new Set();
      didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
      didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
      didWarnAboutDirectlyAssigningPropsToState = new Set();
      didWarnAboutUndefinedDerivedState = new Set();
      didWarnAboutContextTypeAndContextTypes = new Set();
      didWarnAboutInvalidateContextType = new Set();
      var didWarnOnInvalidCallback = new Set();
      warnOnInvalidCallback = function warnOnInvalidCallback(callback, callerName) {
        if (callback === null || typeof callback === "function") {
          return;
        }
        var key = callerName + "_" + callback;
        if (!didWarnOnInvalidCallback.has(key)) {
          didWarnOnInvalidCallback.add(key);
          error("%s(...): Expected the last optional `callback` argument to be a " + "function. Instead received: %s.", callerName, callback);
        }
      };
      warnOnUndefinedDerivedState = function warnOnUndefinedDerivedState(type, partialState) {
        if (partialState === undefined) {
          var componentName = getComponentNameFromType(type) || "Component";
          if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
            didWarnAboutUndefinedDerivedState.add(componentName);
            error("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. " + "You have returned undefined.", componentName);
          }
        }
      };
      Object.defineProperty(fakeInternalInstance, "_processChildContext", {
        enumerable: false,
        value: function value() {
          throw new Error("_processChildContext is not available in React 16+. This likely " + "means you have multiple copies of React and are attempting to nest " + "a React 15 tree inside a React 16 tree using " + "unstable_renderSubtreeIntoContainer, which isn't supported. Try " + "to make sure you have only one copy of React (and ideally, switch " + "to ReactDOM.createPortal).");
        }
      });
      Object.freeze(fakeInternalInstance);
    }
    function applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, nextProps) {
      var prevState = workInProgress.memoizedState;
      var partialState = getDerivedStateFromProps(nextProps, prevState);
      {
        warnOnUndefinedDerivedState(ctor, partialState);
      }
      var memoizedState = partialState === null || partialState === undefined ? prevState : assign({}, prevState, partialState);
      workInProgress.memoizedState = memoizedState;
      if (workInProgress.lanes === NoLanes) {
        var updateQueue = workInProgress.updateQueue;
        updateQueue.baseState = memoizedState;
      }
    }
    var classComponentUpdater = {
      isMounted: isMounted,
      enqueueSetState: function enqueueSetState(inst, payload, callback) {
        var fiber = get(inst);
        var eventTime = requestEventTime();
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(eventTime, lane);
        update.payload = payload;
        if (callback !== undefined && callback !== null) {
          {
            warnOnInvalidCallback(callback, "setState");
          }
          update.callback = callback;
        }
        var root = enqueueUpdate(fiber, update, lane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane, eventTime);
          entangleTransitions(root, fiber, lane);
        }
      },
      enqueueReplaceState: function enqueueReplaceState(inst, payload, callback) {
        var fiber = get(inst);
        var eventTime = requestEventTime();
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(eventTime, lane);
        update.tag = ReplaceState;
        update.payload = payload;
        if (callback !== undefined && callback !== null) {
          {
            warnOnInvalidCallback(callback, "replaceState");
          }
          update.callback = callback;
        }
        var root = enqueueUpdate(fiber, update, lane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane, eventTime);
          entangleTransitions(root, fiber, lane);
        }
      },
      enqueueForceUpdate: function enqueueForceUpdate(inst, callback) {
        var fiber = get(inst);
        var eventTime = requestEventTime();
        var lane = requestUpdateLane(fiber);
        var update = createUpdate(eventTime, lane);
        update.tag = ForceUpdate;
        if (callback !== undefined && callback !== null) {
          {
            warnOnInvalidCallback(callback, "forceUpdate");
          }
          update.callback = callback;
        }
        var root = enqueueUpdate(fiber, update, lane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, lane, eventTime);
          entangleTransitions(root, fiber, lane);
        }
      }
    };
    function checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) {
      var instance = workInProgress.stateNode;
      if (typeof instance.shouldComponentUpdate === "function") {
        var shouldUpdate = instance.shouldComponentUpdate(newProps, newState, nextContext);
        {
          if (shouldUpdate === undefined) {
            error("%s.shouldComponentUpdate(): Returned undefined instead of a " + "boolean value. Make sure to return true or false.", getComponentNameFromType(ctor) || "Component");
          }
        }
        return shouldUpdate;
      }
      if (ctor.prototype && ctor.prototype.isPureReactComponent) {
        return !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState);
      }
      return true;
    }
    function checkClassInstance(workInProgress, ctor, newProps) {
      var instance = workInProgress.stateNode;
      {
        var name = getComponentNameFromType(ctor) || "Component";
        var renderPresent = instance.render;
        if (!renderPresent) {
          if (ctor.prototype && typeof ctor.prototype.render === "function") {
            error("%s(...): No `render` method found on the returned component " + "instance: did you accidentally return an object from the constructor?", name);
          } else {
            error("%s(...): No `render` method found on the returned component " + "instance: you may have forgotten to define `render`.", name);
          }
        }
        if (instance.getInitialState && !instance.getInitialState.isReactClassApproved && !instance.state) {
          error("getInitialState was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Did you mean to define a state property instead?", name);
        }
        if (instance.getDefaultProps && !instance.getDefaultProps.isReactClassApproved) {
          error("getDefaultProps was defined on %s, a plain JavaScript class. " + "This is only supported for classes created using React.createClass. " + "Use a static property to define defaultProps instead.", name);
        }
        if (instance.propTypes) {
          error("propTypes was defined as an instance property on %s. Use a static " + "property to define propTypes instead.", name);
        }
        if (instance.contextType) {
          error("contextType was defined as an instance property on %s. Use a static " + "property to define contextType instead.", name);
        }
        {
          if (instance.contextTypes) {
            error("contextTypes was defined as an instance property on %s. Use a static " + "property to define contextTypes instead.", name);
          }
          if (ctor.contextType && ctor.contextTypes && !didWarnAboutContextTypeAndContextTypes.has(ctor)) {
            didWarnAboutContextTypeAndContextTypes.add(ctor);
            error("%s declares both contextTypes and contextType static properties. " + "The legacy contextTypes property will be ignored.", name);
          }
        }
        if (typeof instance.componentShouldUpdate === "function") {
          error("%s has a method called " + "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " + "The name is phrased as a question because the function is " + "expected to return a value.", name);
        }
        if (ctor.prototype && ctor.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== "undefined") {
          error("%s has a method called shouldComponentUpdate(). " + "shouldComponentUpdate should not be used when extending React.PureComponent. " + "Please extend React.Component if shouldComponentUpdate is used.", getComponentNameFromType(ctor) || "A pure component");
        }
        if (typeof instance.componentDidUnmount === "function") {
          error("%s has a method called " + "componentDidUnmount(). But there is no such lifecycle method. " + "Did you mean componentWillUnmount()?", name);
        }
        if (typeof instance.componentDidReceiveProps === "function") {
          error("%s has a method called " + "componentDidReceiveProps(). But there is no such lifecycle method. " + "If you meant to update the state in response to changing props, " + "use componentWillReceiveProps(). If you meant to fetch data or " + "run side-effects or mutations after React has updated the UI, use componentDidUpdate().", name);
        }
        if (typeof instance.componentWillRecieveProps === "function") {
          error("%s has a method called " + "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", name);
        }
        if (typeof instance.UNSAFE_componentWillRecieveProps === "function") {
          error("%s has a method called " + "UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", name);
        }
        var hasMutatedProps = instance.props !== newProps;
        if (instance.props !== undefined && hasMutatedProps) {
          error("%s(...): When calling super() in `%s`, make sure to pass " + "up the same props that your component's constructor was passed.", name, name);
        }
        if (instance.defaultProps) {
          error("Setting defaultProps as an instance property on %s is not supported and will be ignored." + " Instead, define defaultProps as a static property on %s.", name, name);
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function" && typeof instance.componentDidUpdate !== "function" && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)) {
          didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);
          error("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). " + "This component defines getSnapshotBeforeUpdate() only.", getComponentNameFromType(ctor));
        }
        if (typeof instance.getDerivedStateFromProps === "function") {
          error("%s: getDerivedStateFromProps() is defined as an instance method " + "and will be ignored. Instead, declare it as a static method.", name);
        }
        if (typeof instance.getDerivedStateFromError === "function") {
          error("%s: getDerivedStateFromError() is defined as an instance method " + "and will be ignored. Instead, declare it as a static method.", name);
        }
        if (typeof ctor.getSnapshotBeforeUpdate === "function") {
          error("%s: getSnapshotBeforeUpdate() is defined as a static method " + "and will be ignored. Instead, declare it as an instance method.", name);
        }
        var _state = instance.state;
        if (_state && (typeof _state !== "object" || isArray(_state))) {
          error("%s.state: must be set to an object or null", name);
        }
        if (typeof instance.getChildContext === "function" && typeof ctor.childContextTypes !== "object") {
          error("%s.getChildContext(): childContextTypes must be defined in order to " + "use getChildContext().", name);
        }
      }
    }
    function adoptClassInstance(workInProgress, instance) {
      instance.updater = classComponentUpdater;
      workInProgress.stateNode = instance;
      set(instance, workInProgress);
      {
        instance._reactInternalInstance = fakeInternalInstance;
      }
    }
    function constructClassInstance(workInProgress, ctor, props) {
      var isLegacyContextConsumer = false;
      var unmaskedContext = emptyContextObject;
      var context = emptyContextObject;
      var contextType = ctor.contextType;
      {
        if ("contextType" in ctor) {
          var isValid = contextType === null || contextType !== undefined && contextType.$$typeof === REACT_CONTEXT_TYPE && contextType._context === undefined;
          if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
            didWarnAboutInvalidateContextType.add(ctor);
            var addendum = "";
            if (contextType === undefined) {
              addendum = " However, it is set to undefined. " + "This can be caused by a typo or by mixing up named and default imports. " + "This can also happen due to a circular dependency, so " + "try moving the createContext() call to a separate file.";
            } else if (typeof contextType !== "object") {
              addendum = " However, it is set to a " + typeof contextType + ".";
            } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
              addendum = " Did you accidentally pass the Context.Provider instead?";
            } else if (contextType._context !== undefined) {
              addendum = " Did you accidentally pass the Context.Consumer instead?";
            } else {
              addendum = " However, it is set to an object with keys {" + Object.keys(contextType).join(", ") + "}.";
            }
            error("%s defines an invalid contextType. " + "contextType should point to the Context object returned by React.createContext().%s", getComponentNameFromType(ctor) || "Component", addendum);
          }
        }
      }
      if (typeof contextType === "object" && contextType !== null) {
        context = _readContext(contextType);
      } else {
        unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
        var contextTypes = ctor.contextTypes;
        isLegacyContextConsumer = contextTypes !== null && contextTypes !== undefined;
        context = isLegacyContextConsumer ? getMaskedContext(workInProgress, unmaskedContext) : emptyContextObject;
      }
      var instance = new ctor(props, context);
      var state = workInProgress.memoizedState = instance.state !== null && instance.state !== undefined ? instance.state : null;
      adoptClassInstance(workInProgress, instance);
      {
        if (typeof ctor.getDerivedStateFromProps === "function" && state === null) {
          var componentName = getComponentNameFromType(ctor) || "Component";
          if (!didWarnAboutUninitializedState.has(componentName)) {
            didWarnAboutUninitializedState.add(componentName);
            error("`%s` uses `getDerivedStateFromProps` but its initial state is " + "%s. This is not recommended. Instead, define the initial state by " + "assigning an object to `this.state` in the constructor of `%s`. " + "This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", componentName, instance.state === null ? "null" : "undefined", componentName);
          }
        }
        if (typeof ctor.getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function") {
          var foundWillMountName = null;
          var foundWillReceivePropsName = null;
          var foundWillUpdateName = null;
          if (typeof instance.componentWillMount === "function" && instance.componentWillMount.__suppressDeprecationWarning !== true) {
            foundWillMountName = "componentWillMount";
          } else if (typeof instance.UNSAFE_componentWillMount === "function") {
            foundWillMountName = "UNSAFE_componentWillMount";
          }
          if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
            foundWillReceivePropsName = "componentWillReceiveProps";
          } else if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
            foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
          }
          if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
            foundWillUpdateName = "componentWillUpdate";
          } else if (typeof instance.UNSAFE_componentWillUpdate === "function") {
            foundWillUpdateName = "UNSAFE_componentWillUpdate";
          }
          if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
            var _componentName = getComponentNameFromType(ctor) || "Component";
            var newApiName = typeof ctor.getDerivedStateFromProps === "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
              didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);
              error("Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" + "%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n" + "The above lifecycles should be removed. Learn more about this warning here:\n" + "https://reactjs.org/link/unsafe-component-lifecycles", _componentName, newApiName, foundWillMountName !== null ? "\n  " + foundWillMountName : "", foundWillReceivePropsName !== null ? "\n  " + foundWillReceivePropsName : "", foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : "");
            }
          }
        }
      }
      if (isLegacyContextConsumer) {
        cacheContext(workInProgress, unmaskedContext, context);
      }
      return instance;
    }
    function callComponentWillMount(workInProgress, instance) {
      var oldState = instance.state;
      if (typeof instance.componentWillMount === "function") {
        instance.componentWillMount();
      }
      if (typeof instance.UNSAFE_componentWillMount === "function") {
        instance.UNSAFE_componentWillMount();
      }
      if (oldState !== instance.state) {
        {
          error("%s.componentWillMount(): Assigning directly to this.state is " + "deprecated (except inside a component's " + "constructor). Use setState instead.", getComponentNameFromFiber(workInProgress) || "Component");
        }
        classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
      }
    }
    function callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext) {
      var oldState = instance.state;
      if (typeof instance.componentWillReceiveProps === "function") {
        instance.componentWillReceiveProps(newProps, nextContext);
      }
      if (typeof instance.UNSAFE_componentWillReceiveProps === "function") {
        instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
      }
      if (instance.state !== oldState) {
        {
          var componentName = getComponentNameFromFiber(workInProgress) || "Component";
          if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
            didWarnAboutStateAssignmentForComponent.add(componentName);
            error("%s.componentWillReceiveProps(): Assigning directly to " + "this.state is deprecated (except inside a component's " + "constructor). Use setState instead.", componentName);
          }
        }
        classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
      }
    }
    function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
      {
        checkClassInstance(workInProgress, ctor, newProps);
      }
      var instance = workInProgress.stateNode;
      instance.props = newProps;
      instance.state = workInProgress.memoizedState;
      instance.refs = emptyRefsObject;
      initializeUpdateQueue(workInProgress);
      var contextType = ctor.contextType;
      if (typeof contextType === "object" && contextType !== null) {
        instance.context = _readContext(contextType);
      } else {
        var unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
        instance.context = getMaskedContext(workInProgress, unmaskedContext);
      }
      {
        if (instance.state === newProps) {
          var componentName = getComponentNameFromType(ctor) || "Component";
          if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
            didWarnAboutDirectlyAssigningPropsToState.add(componentName);
            error("%s: It is not recommended to assign props directly to state " + "because updates to props won't be reflected in state. " + "In most cases, it is better to use props directly.", componentName);
          }
        }
        if (workInProgress.mode & StrictLegacyMode) {
          ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, instance);
        }
        {
          ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(workInProgress, instance);
        }
      }
      instance.state = workInProgress.memoizedState;
      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
        instance.state = workInProgress.memoizedState;
      }
      if (typeof ctor.getDerivedStateFromProps !== "function" && typeof instance.getSnapshotBeforeUpdate !== "function" && (typeof instance.UNSAFE_componentWillMount === "function" || typeof instance.componentWillMount === "function")) {
        callComponentWillMount(workInProgress, instance);
        processUpdateQueue(workInProgress, newProps, instance, renderLanes);
        instance.state = workInProgress.memoizedState;
      }
      if (typeof instance.componentDidMount === "function") {
        var fiberFlags = Update;
        workInProgress.flags |= fiberFlags;
      }
    }
    function resumeMountClassInstance(workInProgress, ctor, newProps, renderLanes) {
      var instance = workInProgress.stateNode;
      var oldProps = workInProgress.memoizedProps;
      instance.props = oldProps;
      var oldContext = instance.context;
      var contextType = ctor.contextType;
      var nextContext = emptyContextObject;
      if (typeof contextType === "object" && contextType !== null) {
        nextContext = _readContext(contextType);
      } else {
        var nextLegacyUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
        nextContext = getMaskedContext(workInProgress, nextLegacyUnmaskedContext);
      }
      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      var hasNewLifecycles = typeof getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function";
      if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === "function" || typeof instance.componentWillReceiveProps === "function")) {
        if (oldProps !== newProps || oldContext !== nextContext) {
          callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
        }
      }
      resetHasForceUpdateBeforeProcessing();
      var oldState = workInProgress.memoizedState;
      var newState = instance.state = oldState;
      processUpdateQueue(workInProgress, newProps, instance, renderLanes);
      newState = workInProgress.memoizedState;
      if (oldProps === newProps && oldState === newState && !hasContextChanged() && !checkHasForceUpdateAfterProcessing()) {
        if (typeof instance.componentDidMount === "function") {
          var fiberFlags = Update;
          workInProgress.flags |= fiberFlags;
        }
        return false;
      }
      if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
        newState = workInProgress.memoizedState;
      }
      var shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext);
      if (shouldUpdate) {
        if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillMount === "function" || typeof instance.componentWillMount === "function")) {
          if (typeof instance.componentWillMount === "function") {
            instance.componentWillMount();
          }
          if (typeof instance.UNSAFE_componentWillMount === "function") {
            instance.UNSAFE_componentWillMount();
          }
        }
        if (typeof instance.componentDidMount === "function") {
          var _fiberFlags = Update;
          workInProgress.flags |= _fiberFlags;
        }
      } else {
        if (typeof instance.componentDidMount === "function") {
          var _fiberFlags2 = Update;
          workInProgress.flags |= _fiberFlags2;
        }
        workInProgress.memoizedProps = newProps;
        workInProgress.memoizedState = newState;
      }
      instance.props = newProps;
      instance.state = newState;
      instance.context = nextContext;
      return shouldUpdate;
    }
    function updateClassInstance(current, workInProgress, ctor, newProps, renderLanes) {
      var instance = workInProgress.stateNode;
      cloneUpdateQueue(current, workInProgress);
      var unresolvedOldProps = workInProgress.memoizedProps;
      var oldProps = workInProgress.type === workInProgress.elementType ? unresolvedOldProps : resolveDefaultProps(workInProgress.type, unresolvedOldProps);
      instance.props = oldProps;
      var unresolvedNewProps = workInProgress.pendingProps;
      var oldContext = instance.context;
      var contextType = ctor.contextType;
      var nextContext = emptyContextObject;
      if (typeof contextType === "object" && contextType !== null) {
        nextContext = _readContext(contextType);
      } else {
        var nextUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
        nextContext = getMaskedContext(workInProgress, nextUnmaskedContext);
      }
      var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
      var hasNewLifecycles = typeof getDerivedStateFromProps === "function" || typeof instance.getSnapshotBeforeUpdate === "function";
      if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === "function" || typeof instance.componentWillReceiveProps === "function")) {
        if (unresolvedOldProps !== unresolvedNewProps || oldContext !== nextContext) {
          callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
        }
      }
      resetHasForceUpdateBeforeProcessing();
      var oldState = workInProgress.memoizedState;
      var newState = instance.state = oldState;
      processUpdateQueue(workInProgress, newProps, instance, renderLanes);
      newState = workInProgress.memoizedState;
      if (unresolvedOldProps === unresolvedNewProps && oldState === newState && !hasContextChanged() && !checkHasForceUpdateAfterProcessing() && !enableLazyContextPropagation) {
        if (typeof instance.componentDidUpdate === "function") {
          if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.flags |= Update;
          }
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function") {
          if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.flags |= Snapshot;
          }
        }
        return false;
      }
      if (typeof getDerivedStateFromProps === "function") {
        applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
        newState = workInProgress.memoizedState;
      }
      var shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) || enableLazyContextPropagation;
      if (shouldUpdate) {
        if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillUpdate === "function" || typeof instance.componentWillUpdate === "function")) {
          if (typeof instance.componentWillUpdate === "function") {
            instance.componentWillUpdate(newProps, newState, nextContext);
          }
          if (typeof instance.UNSAFE_componentWillUpdate === "function") {
            instance.UNSAFE_componentWillUpdate(newProps, newState, nextContext);
          }
        }
        if (typeof instance.componentDidUpdate === "function") {
          workInProgress.flags |= Update;
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function") {
          workInProgress.flags |= Snapshot;
        }
      } else {
        if (typeof instance.componentDidUpdate === "function") {
          if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.flags |= Update;
          }
        }
        if (typeof instance.getSnapshotBeforeUpdate === "function") {
          if (unresolvedOldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.flags |= Snapshot;
          }
        }
        workInProgress.memoizedProps = newProps;
        workInProgress.memoizedState = newState;
      }
      instance.props = newProps;
      instance.state = newState;
      instance.context = nextContext;
      return shouldUpdate;
    }
    var didWarnAboutMaps;
    var didWarnAboutGenerators;
    var didWarnAboutStringRefs;
    var ownerHasKeyUseWarning;
    var ownerHasFunctionTypeWarning;
    var warnForMissingKey = function warnForMissingKey(child, returnFiber) {};
    {
      didWarnAboutMaps = false;
      didWarnAboutGenerators = false;
      didWarnAboutStringRefs = {};
      ownerHasKeyUseWarning = {};
      ownerHasFunctionTypeWarning = {};
      warnForMissingKey = function warnForMissingKey(child, returnFiber) {
        if (child === null || typeof child !== "object") {
          return;
        }
        if (!child._store || child._store.validated || child.key != null) {
          return;
        }
        if (typeof child._store !== "object") {
          throw new Error("React Component in warnForMissingKey should have a _store. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
        child._store.validated = true;
        var componentName = getComponentNameFromFiber(returnFiber) || "Component";
        if (ownerHasKeyUseWarning[componentName]) {
          return;
        }
        ownerHasKeyUseWarning[componentName] = true;
        error("Each child in a list should have a unique " + '"key" prop. See https://reactjs.org/link/warning-keys for ' + "more information.");
      };
    }
    function coerceRef(returnFiber, current, element) {
      var mixedRef = element.ref;
      if (mixedRef !== null && typeof mixedRef !== "function" && typeof mixedRef !== "object") {
        {
          if ((returnFiber.mode & StrictLegacyMode || warnAboutStringRefs) && !(element._owner && element._self && element._owner.stateNode !== element._self)) {
            var componentName = getComponentNameFromFiber(returnFiber) || "Component";
            if (!didWarnAboutStringRefs[componentName]) {
              {
                error('A string ref, "%s", has been found within a strict mode tree. ' + "String refs are a source of potential bugs and should be avoided. " + "We recommend using useRef() or createRef() instead. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-string-ref", mixedRef);
              }
              didWarnAboutStringRefs[componentName] = true;
            }
          }
        }
        if (element._owner) {
          var owner = element._owner;
          var inst;
          if (owner) {
            var ownerFiber = owner;
            if (ownerFiber.tag !== ClassComponent) {
              throw new Error("Function components cannot have string refs. " + "We recommend using useRef() instead. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-string-ref");
            }
            inst = ownerFiber.stateNode;
          }
          if (!inst) {
            throw new Error("Missing owner for string ref " + mixedRef + ". This error is likely caused by a " + "bug in React. Please file an issue.");
          }
          var resolvedInst = inst;
          {
            checkPropStringCoercion(mixedRef, "ref");
          }
          var stringRef = "" + mixedRef;
          if (current !== null && current.ref !== null && typeof current.ref === "function" && current.ref._stringRef === stringRef) {
            return current.ref;
          }
          var ref = function ref(value) {
            var refs = resolvedInst.refs;
            if (refs === emptyRefsObject) {
              refs = resolvedInst.refs = {};
            }
            if (value === null) {
              delete refs[stringRef];
            } else {
              refs[stringRef] = value;
            }
          };
          ref._stringRef = stringRef;
          return ref;
        } else {
          if (typeof mixedRef !== "string") {
            throw new Error("Expected ref to be a function, a string, an object returned by React.createRef(), or null.");
          }
          if (!element._owner) {
            throw new Error("Element ref was specified as a string (" + mixedRef + ") but no owner was set. This could happen for one of" + " the following reasons:\n" + "1. You may be adding a ref to a function component\n" + "2. You may be adding a ref to a component that was not created inside a component's render method\n" + "3. You have multiple copies of React loaded\n" + "See https://reactjs.org/link/refs-must-have-owner for more information.");
          }
        }
      }
      return mixedRef;
    }
    function throwOnInvalidObjectType(returnFiber, newChild) {
      var childString = Object.prototype.toString.call(newChild);
      throw new Error("Objects are not valid as a React child (found: " + (childString === "[object Object]" ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : childString) + "). " + "If you meant to render a collection of children, use an array " + "instead.");
    }
    function warnOnFunctionType(returnFiber) {
      {
        var componentName = getComponentNameFromFiber(returnFiber) || "Component";
        if (ownerHasFunctionTypeWarning[componentName]) {
          return;
        }
        ownerHasFunctionTypeWarning[componentName] = true;
        error("Functions are not valid as a React child. This may happen if " + "you return a Component instead of <Component /> from render. " + "Or maybe you meant to call this function rather than return it.");
      }
    }
    function resolveLazy(lazyType) {
      var payload = lazyType._payload;
      var init = lazyType._init;
      return init(payload);
    }
    function ChildReconciler(shouldTrackSideEffects) {
      function deleteChild(returnFiber, childToDelete) {
        if (!shouldTrackSideEffects) {
          return;
        }
        var deletions = returnFiber.deletions;
        if (deletions === null) {
          returnFiber.deletions = [childToDelete];
          returnFiber.flags |= ChildDeletion;
        } else {
          deletions.push(childToDelete);
        }
      }
      function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) {
          return null;
        }
        var childToDelete = currentFirstChild;
        while (childToDelete !== null) {
          deleteChild(returnFiber, childToDelete);
          childToDelete = childToDelete.sibling;
        }
        return null;
      }
      function mapRemainingChildren(returnFiber, currentFirstChild) {
        var existingChildren = new Map();
        var existingChild = currentFirstChild;
        while (existingChild !== null) {
          if (existingChild.key !== null) {
            existingChildren.set(existingChild.key, existingChild);
          } else {
            existingChildren.set(existingChild.index, existingChild);
          }
          existingChild = existingChild.sibling;
        }
        return existingChildren;
      }
      function useFiber(fiber, pendingProps) {
        var clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibling = null;
        return clone;
      }
      function placeChild(newFiber, lastPlacedIndex, newIndex) {
        newFiber.index = newIndex;
        if (!shouldTrackSideEffects) {
          newFiber.flags |= Forked;
          return lastPlacedIndex;
        }
        var current = newFiber.alternate;
        if (current !== null) {
          var oldIndex = current.index;
          if (oldIndex < lastPlacedIndex) {
            newFiber.flags |= Placement;
            return lastPlacedIndex;
          } else {
            return oldIndex;
          }
        } else {
          newFiber.flags |= Placement;
          return lastPlacedIndex;
        }
      }
      function placeSingleChild(newFiber) {
        if (shouldTrackSideEffects && newFiber.alternate === null) {
          newFiber.flags |= Placement;
        }
        return newFiber;
      }
      function updateTextNode(returnFiber, current, textContent, lanes) {
        if (current === null || current.tag !== HostText) {
          var created = createFiberFromText(textContent, returnFiber.mode, lanes);
          created.return = returnFiber;
          return created;
        } else {
          var existing = useFiber(current, textContent);
          existing.return = returnFiber;
          return existing;
        }
      }
      function updateElement(returnFiber, current, element, lanes) {
        var elementType = element.type;
        if (elementType === REACT_FRAGMENT_TYPE) {
          return updateFragment(returnFiber, current, element.props.children, lanes, element.key);
        }
        if (current !== null) {
          if (current.elementType === elementType || isCompatibleFamilyForHotReloading(current, element) || typeof elementType === "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current.type) {
            var existing = useFiber(current, element.props);
            existing.ref = coerceRef(returnFiber, current, element);
            existing.return = returnFiber;
            {
              existing._debugSource = element._source;
              existing._debugOwner = element._owner;
            }
            return existing;
          }
        }
        var created = createFiberFromElement(element, returnFiber.mode, lanes);
        created.ref = coerceRef(returnFiber, current, element);
        created.return = returnFiber;
        return created;
      }
      function updatePortal(returnFiber, current, portal, lanes) {
        if (current === null || current.tag !== HostPortal || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation) {
          var created = createFiberFromPortal(portal, returnFiber.mode, lanes);
          created.return = returnFiber;
          return created;
        } else {
          var existing = useFiber(current, portal.children || []);
          existing.return = returnFiber;
          return existing;
        }
      }
      function updateFragment(returnFiber, current, fragment, lanes, key) {
        if (current === null || current.tag !== Fragment) {
          var created = createFiberFromFragment(fragment, returnFiber.mode, lanes, key);
          created.return = returnFiber;
          return created;
        } else {
          var existing = useFiber(current, fragment);
          existing.return = returnFiber;
          return existing;
        }
      }
      function createChild(returnFiber, newChild, lanes) {
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
          var created = createFiberFromText("" + newChild, returnFiber.mode, lanes);
          created.return = returnFiber;
          return created;
        }
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              {
                var _created = createFiberFromElement(newChild, returnFiber.mode, lanes);
                _created.ref = coerceRef(returnFiber, null, newChild);
                _created.return = returnFiber;
                return _created;
              }
            case REACT_PORTAL_TYPE:
              {
                var _created2 = createFiberFromPortal(newChild, returnFiber.mode, lanes);
                _created2.return = returnFiber;
                return _created2;
              }
            case REACT_LAZY_TYPE:
              {
                var payload = newChild._payload;
                var init = newChild._init;
                return createChild(returnFiber, init(payload), lanes);
              }
          }
          if (isArray(newChild) || getIteratorFn(newChild)) {
            var _created3 = createFiberFromFragment(newChild, returnFiber.mode, lanes, null);
            _created3.return = returnFiber;
            return _created3;
          }
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber);
          }
        }
        return null;
      }
      function updateSlot(returnFiber, oldFiber, newChild, lanes) {
        var key = oldFiber !== null ? oldFiber.key : null;
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
          if (key !== null) {
            return null;
          }
          return updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
        }
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              {
                if (newChild.key === key) {
                  return updateElement(returnFiber, oldFiber, newChild, lanes);
                } else {
                  return null;
                }
              }
            case REACT_PORTAL_TYPE:
              {
                if (newChild.key === key) {
                  return updatePortal(returnFiber, oldFiber, newChild, lanes);
                } else {
                  return null;
                }
              }
            case REACT_LAZY_TYPE:
              {
                var payload = newChild._payload;
                var init = newChild._init;
                return updateSlot(returnFiber, oldFiber, init(payload), lanes);
              }
          }
          if (isArray(newChild) || getIteratorFn(newChild)) {
            if (key !== null) {
              return null;
            }
            return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
          }
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber);
          }
        }
        return null;
      }
      function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
          var matchedFiber = existingChildren.get(newIdx) || null;
          return updateTextNode(returnFiber, matchedFiber, "" + newChild, lanes);
        }
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              {
                var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                return updateElement(returnFiber, _matchedFiber, newChild, lanes);
              }
            case REACT_PORTAL_TYPE:
              {
                var _matchedFiber2 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                return updatePortal(returnFiber, _matchedFiber2, newChild, lanes);
              }
            case REACT_LAZY_TYPE:
              var payload = newChild._payload;
              var init = newChild._init;
              return updateFromMap(existingChildren, returnFiber, newIdx, init(payload), lanes);
          }
          if (isArray(newChild) || getIteratorFn(newChild)) {
            var _matchedFiber3 = existingChildren.get(newIdx) || null;
            return updateFragment(returnFiber, _matchedFiber3, newChild, lanes, null);
          }
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber);
          }
        }
        return null;
      }
      function warnOnInvalidKey(child, knownKeys, returnFiber) {
        {
          if (typeof child !== "object" || child === null) {
            return knownKeys;
          }
          switch (child.$$typeof) {
            case REACT_ELEMENT_TYPE:
            case REACT_PORTAL_TYPE:
              warnForMissingKey(child, returnFiber);
              var key = child.key;
              if (typeof key !== "string") {
                break;
              }
              if (knownKeys === null) {
                knownKeys = new Set();
                knownKeys.add(key);
                break;
              }
              if (!knownKeys.has(key)) {
                knownKeys.add(key);
                break;
              }
              error("Encountered two children with the same key, `%s`. " + "Keys should be unique so that components maintain their identity " + "across updates. Non-unique keys may cause children to be " + "duplicated and/or omitted — the behavior is unsupported and " + "could change in a future version.", key);
              break;
            case REACT_LAZY_TYPE:
              var payload = child._payload;
              var init = child._init;
              warnOnInvalidKey(init(payload), knownKeys, returnFiber);
              break;
          }
        }
        return knownKeys;
      }
      function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
        {
          var knownKeys = null;
          for (var i = 0; i < newChildren.length; i++) {
            var child = newChildren[i];
            knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
          }
        }
        var resultingFirstChild = null;
        var previousNewFiber = null;
        var oldFiber = currentFirstChild;
        var lastPlacedIndex = 0;
        var newIdx = 0;
        var nextOldFiber = null;
        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
          if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
          } else {
            nextOldFiber = oldFiber.sibling;
          }
          var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);
          if (newFiber === null) {
            if (oldFiber === null) {
              oldFiber = nextOldFiber;
            }
            break;
          }
          if (shouldTrackSideEffects) {
            if (oldFiber && newFiber.alternate === null) {
              deleteChild(returnFiber, oldFiber);
            }
          }
          lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
          if (previousNewFiber === null) {
            resultingFirstChild = newFiber;
          } else {
            previousNewFiber.sibling = newFiber;
          }
          previousNewFiber = newFiber;
          oldFiber = nextOldFiber;
        }
        if (newIdx === newChildren.length) {
          deleteRemainingChildren(returnFiber, oldFiber);
          return resultingFirstChild;
        }
        if (oldFiber === null) {
          for (; newIdx < newChildren.length; newIdx++) {
            var _newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
            if (_newFiber === null) {
              continue;
            }
            lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
              resultingFirstChild = _newFiber;
            } else {
              previousNewFiber.sibling = _newFiber;
            }
            previousNewFiber = _newFiber;
          }
          return resultingFirstChild;
        }
        var existingChildren = mapRemainingChildren(returnFiber, oldFiber);
        for (; newIdx < newChildren.length; newIdx++) {
          var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], lanes);
          if (_newFiber2 !== null) {
            if (shouldTrackSideEffects) {
              if (_newFiber2.alternate !== null) {
                existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
              }
            }
            lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
              resultingFirstChild = _newFiber2;
            } else {
              previousNewFiber.sibling = _newFiber2;
            }
            previousNewFiber = _newFiber2;
          }
        }
        if (shouldTrackSideEffects) {
          existingChildren.forEach(function (child) {
            return deleteChild(returnFiber, child);
          });
        }
        return resultingFirstChild;
      }
      function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, lanes) {
        var iteratorFn = getIteratorFn(newChildrenIterable);
        if (typeof iteratorFn !== "function") {
          throw new Error("An object is not an iterable. This error is likely caused by a bug in " + "React. Please file an issue.");
        }
        {
          if (typeof Symbol === "function" && newChildrenIterable[Symbol.toStringTag] === "Generator") {
            if (!didWarnAboutGenerators) {
              error("Using Generators as children is unsupported and will likely yield " + "unexpected results because enumerating a generator mutates it. " + "You may convert it to an array with `Array.from()` or the " + "`[...spread]` operator before rendering. Keep in mind " + "you might need to polyfill these features for older browsers.");
            }
            didWarnAboutGenerators = true;
          }
          if (newChildrenIterable.entries === iteratorFn) {
            if (!didWarnAboutMaps) {
              error("Using Maps as children is not supported. " + "Use an array of keyed ReactElements instead.");
            }
            didWarnAboutMaps = true;
          }
          var _newChildren = iteratorFn.call(newChildrenIterable);
          if (_newChildren) {
            var knownKeys = null;
            var _step = _newChildren.next();
            for (; !_step.done; _step = _newChildren.next()) {
              var child = _step.value;
              knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
            }
          }
        }
        var newChildren = iteratorFn.call(newChildrenIterable);
        if (newChildren == null) {
          throw new Error("An iterable object provided no iterator.");
        }
        var resultingFirstChild = null;
        var previousNewFiber = null;
        var oldFiber = currentFirstChild;
        var lastPlacedIndex = 0;
        var newIdx = 0;
        var nextOldFiber = null;
        var step = newChildren.next();
        for (; oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
          if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
          } else {
            nextOldFiber = oldFiber.sibling;
          }
          var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
          if (newFiber === null) {
            if (oldFiber === null) {
              oldFiber = nextOldFiber;
            }
            break;
          }
          if (shouldTrackSideEffects) {
            if (oldFiber && newFiber.alternate === null) {
              deleteChild(returnFiber, oldFiber);
            }
          }
          lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
          if (previousNewFiber === null) {
            resultingFirstChild = newFiber;
          } else {
            previousNewFiber.sibling = newFiber;
          }
          previousNewFiber = newFiber;
          oldFiber = nextOldFiber;
        }
        if (step.done) {
          deleteRemainingChildren(returnFiber, oldFiber);
          return resultingFirstChild;
        }
        if (oldFiber === null) {
          for (; !step.done; newIdx++, step = newChildren.next()) {
            var _newFiber3 = createChild(returnFiber, step.value, lanes);
            if (_newFiber3 === null) {
              continue;
            }
            lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
              resultingFirstChild = _newFiber3;
            } else {
              previousNewFiber.sibling = _newFiber3;
            }
            previousNewFiber = _newFiber3;
          }
          return resultingFirstChild;
        }
        var existingChildren = mapRemainingChildren(returnFiber, oldFiber);
        for (; !step.done; newIdx++, step = newChildren.next()) {
          var _newFiber4 = updateFromMap(existingChildren, returnFiber, newIdx, step.value, lanes);
          if (_newFiber4 !== null) {
            if (shouldTrackSideEffects) {
              if (_newFiber4.alternate !== null) {
                existingChildren.delete(_newFiber4.key === null ? newIdx : _newFiber4.key);
              }
            }
            lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
              resultingFirstChild = _newFiber4;
            } else {
              previousNewFiber.sibling = _newFiber4;
            }
            previousNewFiber = _newFiber4;
          }
        }
        if (shouldTrackSideEffects) {
          existingChildren.forEach(function (child) {
            return deleteChild(returnFiber, child);
          });
        }
        return resultingFirstChild;
      }
      function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, lanes) {
        if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
          deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
          var existing = useFiber(currentFirstChild, textContent);
          existing.return = returnFiber;
          return existing;
        }
        deleteRemainingChildren(returnFiber, currentFirstChild);
        var created = createFiberFromText(textContent, returnFiber.mode, lanes);
        created.return = returnFiber;
        return created;
      }
      function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
        var key = element.key;
        var child = currentFirstChild;
        while (child !== null) {
          if (child.key === key) {
            var elementType = element.type;
            if (elementType === REACT_FRAGMENT_TYPE) {
              if (child.tag === Fragment) {
                deleteRemainingChildren(returnFiber, child.sibling);
                var existing = useFiber(child, element.props.children);
                existing.return = returnFiber;
                {
                  existing._debugSource = element._source;
                  existing._debugOwner = element._owner;
                }
                return existing;
              }
            } else {
              if (child.elementType === elementType || isCompatibleFamilyForHotReloading(child, element) || typeof elementType === "object" && elementType !== null && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === child.type) {
                deleteRemainingChildren(returnFiber, child.sibling);
                var _existing = useFiber(child, element.props);
                _existing.ref = coerceRef(returnFiber, child, element);
                _existing.return = returnFiber;
                {
                  _existing._debugSource = element._source;
                  _existing._debugOwner = element._owner;
                }
                return _existing;
              }
            }
            deleteRemainingChildren(returnFiber, child);
            break;
          } else {
            deleteChild(returnFiber, child);
          }
          child = child.sibling;
        }
        if (element.type === REACT_FRAGMENT_TYPE) {
          var created = createFiberFromFragment(element.props.children, returnFiber.mode, lanes, element.key);
          created.return = returnFiber;
          return created;
        } else {
          var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);
          _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
          _created4.return = returnFiber;
          return _created4;
        }
      }
      function reconcileSinglePortal(returnFiber, currentFirstChild, portal, lanes) {
        var key = portal.key;
        var child = currentFirstChild;
        while (child !== null) {
          if (child.key === key) {
            if (child.tag === HostPortal && child.stateNode.containerInfo === portal.containerInfo && child.stateNode.implementation === portal.implementation) {
              deleteRemainingChildren(returnFiber, child.sibling);
              var existing = useFiber(child, portal.children || []);
              existing.return = returnFiber;
              return existing;
            } else {
              deleteRemainingChildren(returnFiber, child);
              break;
            }
          } else {
            deleteChild(returnFiber, child);
          }
          child = child.sibling;
        }
        var created = createFiberFromPortal(portal, returnFiber.mode, lanes);
        created.return = returnFiber;
        return created;
      }
      function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {
        var isUnkeyedTopLevelFragment = typeof newChild === "object" && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;
        if (isUnkeyedTopLevelFragment) {
          newChild = newChild.props.children;
        }
        if (typeof newChild === "object" && newChild !== null) {
          switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
              return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));
            case REACT_PORTAL_TYPE:
              return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes));
            case REACT_LAZY_TYPE:
              var payload = newChild._payload;
              var init = newChild._init;
              return reconcileChildFibers(returnFiber, currentFirstChild, init(payload), lanes);
          }
          if (isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
          }
          if (getIteratorFn(newChild)) {
            return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
          }
          throwOnInvalidObjectType(returnFiber, newChild);
        }
        if (typeof newChild === "string" && newChild !== "" || typeof newChild === "number") {
          return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild, lanes));
        }
        {
          if (typeof newChild === "function") {
            warnOnFunctionType(returnFiber);
          }
        }
        return deleteRemainingChildren(returnFiber, currentFirstChild);
      }
      return reconcileChildFibers;
    }
    var reconcileChildFibers = ChildReconciler(true);
    var mountChildFibers = ChildReconciler(false);
    function cloneChildFibers(current, workInProgress) {
      if (current !== null && workInProgress.child !== current.child) {
        throw new Error("Resuming work not yet implemented.");
      }
      if (workInProgress.child === null) {
        return;
      }
      var currentChild = workInProgress.child;
      var newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
      workInProgress.child = newChild;
      newChild.return = workInProgress;
      while (currentChild.sibling !== null) {
        currentChild = currentChild.sibling;
        newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
        newChild.return = workInProgress;
      }
      newChild.sibling = null;
    }
    function resetChildFibers(workInProgress, lanes) {
      var child = workInProgress.child;
      while (child !== null) {
        resetWorkInProgress(child, lanes);
        child = child.sibling;
      }
    }
    var NO_CONTEXT = {};
    var contextStackCursor$1 = createCursor(NO_CONTEXT);
    var contextFiberStackCursor = createCursor(NO_CONTEXT);
    var rootInstanceStackCursor = createCursor(NO_CONTEXT);
    function requiredContext(c) {
      if (c === NO_CONTEXT) {
        throw new Error("Expected host context to exist. This error is likely caused by a bug " + "in React. Please file an issue.");
      }
      return c;
    }
    function getRootHostContainer() {
      var rootInstance = requiredContext(rootInstanceStackCursor.current);
      return rootInstance;
    }
    function pushHostContainer(fiber, nextRootInstance) {
      push(rootInstanceStackCursor, nextRootInstance, fiber);
      push(contextFiberStackCursor, fiber, fiber);
      push(contextStackCursor$1, NO_CONTEXT, fiber);
      var nextRootContext = getRootHostContext();
      pop(contextStackCursor$1, fiber);
      push(contextStackCursor$1, nextRootContext, fiber);
    }
    function popHostContainer(fiber) {
      pop(contextStackCursor$1, fiber);
      pop(contextFiberStackCursor, fiber);
      pop(rootInstanceStackCursor, fiber);
    }
    function getHostContext() {
      var context = requiredContext(contextStackCursor$1.current);
      return context;
    }
    function pushHostContext(fiber) {
      var rootInstance = requiredContext(rootInstanceStackCursor.current);
      var context = requiredContext(contextStackCursor$1.current);
      var nextContext = getChildHostContext(context, fiber.type);
      if (context === nextContext) {
        return;
      }
      push(contextFiberStackCursor, fiber, fiber);
      push(contextStackCursor$1, nextContext, fiber);
    }
    function popHostContext(fiber) {
      if (contextFiberStackCursor.current !== fiber) {
        return;
      }
      pop(contextStackCursor$1, fiber);
      pop(contextFiberStackCursor, fiber);
    }
    var DefaultSuspenseContext = 0;
    var SubtreeSuspenseContextMask = 1;
    var InvisibleParentSuspenseContext = 1;
    var ForceSuspenseFallback = 2;
    var suspenseStackCursor = createCursor(DefaultSuspenseContext);
    function hasSuspenseContext(parentContext, flag) {
      return (parentContext & flag) !== 0;
    }
    function setDefaultShallowSuspenseContext(parentContext) {
      return parentContext & SubtreeSuspenseContextMask;
    }
    function setShallowSuspenseContext(parentContext, shallowContext) {
      return parentContext & SubtreeSuspenseContextMask | shallowContext;
    }
    function addSubtreeSuspenseContext(parentContext, subtreeContext) {
      return parentContext | subtreeContext;
    }
    function pushSuspenseContext(fiber, newContext) {
      push(suspenseStackCursor, newContext, fiber);
    }
    function popSuspenseContext(fiber) {
      pop(suspenseStackCursor, fiber);
    }
    function shouldCaptureSuspense(workInProgress, hasInvisibleParent) {
      var nextState = workInProgress.memoizedState;
      if (nextState !== null) {
        if (nextState.dehydrated !== null) {
          return true;
        }
        return false;
      }
      var props = workInProgress.memoizedProps;
      {
        return true;
      }
    }
    function findFirstSuspended(row) {
      var node = row;
      while (node !== null) {
        if (node.tag === SuspenseComponent) {
          var state = node.memoizedState;
          if (state !== null) {
            var dehydrated = state.dehydrated;
            if (dehydrated === null || isSuspenseInstancePending() || isSuspenseInstanceFallback()) {
              return node;
            }
          }
        } else if (node.tag === SuspenseListComponent && node.memoizedProps.revealOrder !== undefined) {
          var didSuspend = (node.flags & DidCapture) !== NoFlags;
          if (didSuspend) {
            return node;
          }
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }
        if (node === row) {
          return null;
        }
        while (node.sibling === null) {
          if (node.return === null || node.return === row) {
            return null;
          }
          node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
      }
      return null;
    }
    var NoFlags$1 = 0;
    var HasEffect = 1;
    var Insertion = 2;
    var Layout = 4;
    var Passive$1 = 8;
    var workInProgressSources = [];
    function resetWorkInProgressVersions() {
      for (var i = 0; i < workInProgressSources.length; i++) {
        var mutableSource = workInProgressSources[i];
        {
          mutableSource._workInProgressVersionPrimary = null;
        }
      }
      workInProgressSources.length = 0;
    }
    var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
      ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig;
    var didWarnAboutMismatchedHooksForComponent;
    var didWarnUncachedGetSnapshot;
    {
      didWarnAboutMismatchedHooksForComponent = new Set();
    }
    var renderLanes = NoLanes;
    var currentlyRenderingFiber$1 = null;
    var currentHook = null;
    var workInProgressHook = null;
    var didScheduleRenderPhaseUpdate = false;
    var didScheduleRenderPhaseUpdateDuringThisPass = false;
    var globalClientIdCounter = 0;
    var RE_RENDER_LIMIT = 25;
    var currentHookNameInDev = null;
    var hookTypesDev = null;
    var hookTypesUpdateIndexDev = -1;
    var ignorePreviousDependencies = false;
    function mountHookTypesDev() {
      {
        var hookName = currentHookNameInDev;
        if (hookTypesDev === null) {
          hookTypesDev = [hookName];
        } else {
          hookTypesDev.push(hookName);
        }
      }
    }
    function updateHookTypesDev() {
      {
        var hookName = currentHookNameInDev;
        if (hookTypesDev !== null) {
          hookTypesUpdateIndexDev++;
          if (hookTypesDev[hookTypesUpdateIndexDev] !== hookName) {
            warnOnHookMismatchInDev(hookName);
          }
        }
      }
    }
    function checkDepsAreArrayDev(deps) {
      {
        if (deps !== undefined && deps !== null && !isArray(deps)) {
          error("%s received a final argument that is not an array (instead, received `%s`). When " + "specified, the final argument must be an array.", currentHookNameInDev, typeof deps);
        }
      }
    }
    function warnOnHookMismatchInDev(currentHookName) {
      {
        var componentName = getComponentNameFromFiber(currentlyRenderingFiber$1);
        if (!didWarnAboutMismatchedHooksForComponent.has(componentName)) {
          didWarnAboutMismatchedHooksForComponent.add(componentName);
          if (hookTypesDev !== null) {
            var table = "";
            var secondColumnStart = 30;
            for (var i = 0; i <= hookTypesUpdateIndexDev; i++) {
              var oldHookName = hookTypesDev[i];
              var newHookName = i === hookTypesUpdateIndexDev ? currentHookName : oldHookName;
              var row = i + 1 + ". " + oldHookName;
              while (row.length < secondColumnStart) {
                row += " ";
              }
              row += newHookName + "\n";
              table += row;
            }
            error("React has detected a change in the order of Hooks called by %s. " + "This will lead to bugs and errors if not fixed. " + "For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n" + "   Previous render            Next render\n" + "   ------------------------------------------------------\n" + "%s" + "   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n", componentName, table);
          }
        }
      }
    }
    function throwInvalidHookError() {
      throw new Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" + " one of the following reasons:\n" + "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" + "2. You might be breaking the Rules of Hooks\n" + "3. You might have more than one copy of React in the same app\n" + "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
    }
    function areHookInputsEqual(nextDeps, prevDeps) {
      {
        if (ignorePreviousDependencies) {
          return false;
        }
      }
      if (prevDeps === null) {
        {
          error("%s received a final argument during this render, but not during " + "the previous render. Even though the final argument is optional, " + "its type cannot change between renders.", currentHookNameInDev);
        }
        return false;
      }
      {
        if (nextDeps.length !== prevDeps.length) {
          error("The final argument passed to %s changed size between renders. The " + "order and size of this array must remain constant.\n\n" + "Previous: %s\n" + "Incoming: %s", currentHookNameInDev, "[" + prevDeps.join(", ") + "]", "[" + nextDeps.join(", ") + "]");
        }
      }
      for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (objectIs(nextDeps[i], prevDeps[i])) {
          continue;
        }
        return false;
      }
      return true;
    }
    function renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderLanes) {
      renderLanes = nextRenderLanes;
      currentlyRenderingFiber$1 = workInProgress;
      {
        hookTypesDev = current !== null ? current._debugHookTypes : null;
        hookTypesUpdateIndexDev = -1;
        ignorePreviousDependencies = current !== null && current.type !== workInProgress.type;
      }
      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null;
      workInProgress.lanes = NoLanes;
      {
        if (current !== null && current.memoizedState !== null) {
          ReactCurrentDispatcher$1.current = HooksDispatcherOnUpdateInDEV;
        } else if (hookTypesDev !== null) {
          ReactCurrentDispatcher$1.current = HooksDispatcherOnMountWithHookTypesInDEV;
        } else {
          ReactCurrentDispatcher$1.current = HooksDispatcherOnMountInDEV;
        }
      }
      var children = Component(props, secondArg);
      if (didScheduleRenderPhaseUpdateDuringThisPass) {
        var numberOfReRenders = 0;
        do {
          didScheduleRenderPhaseUpdateDuringThisPass = false;
          if (numberOfReRenders >= RE_RENDER_LIMIT) {
            throw new Error("Too many re-renders. React limits the number of renders to prevent " + "an infinite loop.");
          }
          numberOfReRenders += 1;
          {
            ignorePreviousDependencies = false;
          }
          currentHook = null;
          workInProgressHook = null;
          workInProgress.updateQueue = null;
          {
            hookTypesUpdateIndexDev = -1;
          }
          ReactCurrentDispatcher$1.current = HooksDispatcherOnRerenderInDEV;
          children = Component(props, secondArg);
        } while (didScheduleRenderPhaseUpdateDuringThisPass);
      }
      ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
      {
        workInProgress._debugHookTypes = hookTypesDev;
      }
      var didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
      renderLanes = NoLanes;
      currentlyRenderingFiber$1 = null;
      currentHook = null;
      workInProgressHook = null;
      {
        currentHookNameInDev = null;
        hookTypesDev = null;
        hookTypesUpdateIndexDev = -1;
        if (current !== null && (current.flags & StaticMask) !== (workInProgress.flags & StaticMask) && (current.mode & ConcurrentMode) !== NoMode) {
          error("Internal React error: Expected static flag was missing. Please " + "notify the React team.");
        }
      }
      didScheduleRenderPhaseUpdate = false;
      if (didRenderTooFewHooks) {
        throw new Error("Rendered fewer hooks than expected. This may be caused by an accidental " + "early return statement.");
      }
      return children;
    }
    function bailoutHooks(current, workInProgress, lanes) {
      workInProgress.updateQueue = current.updateQueue;
      {
        workInProgress.flags &= ~(Passive | Update);
      }
      current.lanes = removeLanes(current.lanes, lanes);
    }
    function resetHooksAfterThrow() {
      ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
      if (didScheduleRenderPhaseUpdate) {
        var hook = currentlyRenderingFiber$1.memoizedState;
        while (hook !== null) {
          var queue = hook.queue;
          if (queue !== null) {
            queue.pending = null;
          }
          hook = hook.next;
        }
        didScheduleRenderPhaseUpdate = false;
      }
      renderLanes = NoLanes;
      currentlyRenderingFiber$1 = null;
      currentHook = null;
      workInProgressHook = null;
      {
        hookTypesDev = null;
        hookTypesUpdateIndexDev = -1;
        currentHookNameInDev = null;
        isUpdatingOpaqueValueInRenderPhase = false;
      }
      didScheduleRenderPhaseUpdateDuringThisPass = false;
    }
    function mountWorkInProgressHook() {
      var hook = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      if (workInProgressHook === null) {
        currentlyRenderingFiber$1.memoizedState = workInProgressHook = hook;
      } else {
        workInProgressHook = workInProgressHook.next = hook;
      }
      return workInProgressHook;
    }
    function updateWorkInProgressHook() {
      var nextCurrentHook;
      if (currentHook === null) {
        var current = currentlyRenderingFiber$1.alternate;
        if (current !== null) {
          nextCurrentHook = current.memoizedState;
        } else {
          nextCurrentHook = null;
        }
      } else {
        nextCurrentHook = currentHook.next;
      }
      var nextWorkInProgressHook;
      if (workInProgressHook === null) {
        nextWorkInProgressHook = currentlyRenderingFiber$1.memoizedState;
      } else {
        nextWorkInProgressHook = workInProgressHook.next;
      }
      if (nextWorkInProgressHook !== null) {
        workInProgressHook = nextWorkInProgressHook;
        nextWorkInProgressHook = workInProgressHook.next;
        currentHook = nextCurrentHook;
      } else {
        if (nextCurrentHook === null) {
          throw new Error("Rendered more hooks than during the previous render.");
        }
        currentHook = nextCurrentHook;
        var newHook = {
          memoizedState: currentHook.memoizedState,
          baseState: currentHook.baseState,
          baseQueue: currentHook.baseQueue,
          queue: currentHook.queue,
          next: null
        };
        if (workInProgressHook === null) {
          currentlyRenderingFiber$1.memoizedState = workInProgressHook = newHook;
        } else {
          workInProgressHook = workInProgressHook.next = newHook;
        }
      }
      return workInProgressHook;
    }
    function createFunctionComponentUpdateQueue() {
      return {
        lastEffect: null,
        stores: null
      };
    }
    function basicStateReducer(state, action) {
      return typeof action === "function" ? action(state) : action;
    }
    function mountReducer(reducer, initialArg, init) {
      var hook = mountWorkInProgressHook();
      var initialState;
      if (init !== undefined) {
        initialState = init(initialArg);
      } else {
        initialState = initialArg;
      }
      hook.memoizedState = hook.baseState = initialState;
      var queue = {
        pending: null,
        interleaved: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialState
      };
      hook.queue = queue;
      var dispatch = queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber$1, queue);
      return [hook.memoizedState, dispatch];
    }
    function updateReducer(reducer, initialArg, init) {
      var hook = updateWorkInProgressHook();
      var queue = hook.queue;
      if (queue === null) {
        throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      }
      queue.lastRenderedReducer = reducer;
      var current = currentHook;
      var baseQueue = current.baseQueue;
      var pendingQueue = queue.pending;
      if (pendingQueue !== null) {
        if (baseQueue !== null) {
          var baseFirst = baseQueue.next;
          var pendingFirst = pendingQueue.next;
          baseQueue.next = pendingFirst;
          pendingQueue.next = baseFirst;
        }
        {
          if (current.baseQueue !== baseQueue) {
            error("Internal error: Expected work-in-progress queue to be a clone. " + "This is a bug in React.");
          }
        }
        current.baseQueue = baseQueue = pendingQueue;
        queue.pending = null;
      }
      if (baseQueue !== null) {
        var first = baseQueue.next;
        var newState = current.baseState;
        var newBaseState = null;
        var newBaseQueueFirst = null;
        var newBaseQueueLast = null;
        var update = first;
        do {
          var updateLane = update.lane;
          if (!isSubsetOfLanes(renderLanes, updateLane)) {
            var clone = {
              lane: updateLane,
              action: update.action,
              hasEagerState: update.hasEagerState,
              eagerState: update.eagerState,
              next: null
            };
            if (newBaseQueueLast === null) {
              newBaseQueueFirst = newBaseQueueLast = clone;
              newBaseState = newState;
            } else {
              newBaseQueueLast = newBaseQueueLast.next = clone;
            }
            currentlyRenderingFiber$1.lanes = mergeLanes(currentlyRenderingFiber$1.lanes, updateLane);
            markSkippedUpdateLanes(updateLane);
          } else {
            if (newBaseQueueLast !== null) {
              var _clone = {
                lane: NoLane,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              };
              newBaseQueueLast = newBaseQueueLast.next = _clone;
            }
            if (update.hasEagerState) {
              newState = update.eagerState;
            } else {
              var action = update.action;
              newState = reducer(newState, action);
            }
          }
          update = update.next;
        } while (update !== null && update !== first);
        if (newBaseQueueLast === null) {
          newBaseState = newState;
        } else {
          newBaseQueueLast.next = newBaseQueueFirst;
        }
        if (!objectIs(newState, hook.memoizedState)) {
          markWorkInProgressReceivedUpdate();
        }
        hook.memoizedState = newState;
        hook.baseState = newBaseState;
        hook.baseQueue = newBaseQueueLast;
        queue.lastRenderedState = newState;
      }
      var lastInterleaved = queue.interleaved;
      if (lastInterleaved !== null) {
        var interleaved = lastInterleaved;
        do {
          var interleavedLane = interleaved.lane;
          currentlyRenderingFiber$1.lanes = mergeLanes(currentlyRenderingFiber$1.lanes, interleavedLane);
          markSkippedUpdateLanes(interleavedLane);
          interleaved = interleaved.next;
        } while (interleaved !== lastInterleaved);
      } else if (baseQueue === null) {
        queue.lanes = NoLanes;
      }
      var dispatch = queue.dispatch;
      return [hook.memoizedState, dispatch];
    }
    function rerenderReducer(reducer, initialArg, init) {
      var hook = updateWorkInProgressHook();
      var queue = hook.queue;
      if (queue === null) {
        throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      }
      queue.lastRenderedReducer = reducer;
      var dispatch = queue.dispatch;
      var lastRenderPhaseUpdate = queue.pending;
      var newState = hook.memoizedState;
      if (lastRenderPhaseUpdate !== null) {
        queue.pending = null;
        var firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        var update = firstRenderPhaseUpdate;
        do {
          var action = update.action;
          newState = reducer(newState, action);
          update = update.next;
        } while (update !== firstRenderPhaseUpdate);
        if (!objectIs(newState, hook.memoizedState)) {
          markWorkInProgressReceivedUpdate();
        }
        hook.memoizedState = newState;
        if (hook.baseQueue === null) {
          hook.baseState = newState;
        }
        queue.lastRenderedState = newState;
      }
      return [newState, dispatch];
    }
    function mountMutableSource(source, getSnapshot, subscribe) {
      {
        return undefined;
      }
    }
    function updateMutableSource(source, getSnapshot, subscribe) {
      {
        return undefined;
      }
    }
    function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      var fiber = currentlyRenderingFiber$1;
      var hook = mountWorkInProgressHook();
      var nextSnapshot;
      {
        nextSnapshot = getSnapshot();
        {
          if (!didWarnUncachedGetSnapshot) {
            var cachedSnapshot = getSnapshot();
            if (!objectIs(nextSnapshot, cachedSnapshot)) {
              error("The result of getSnapshot should be cached to avoid an infinite loop");
              didWarnUncachedGetSnapshot = true;
            }
          }
        }
        var root = getWorkInProgressRoot();
        if (root === null) {
          throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
        }
        if (!includesBlockingLane(root, renderLanes)) {
          pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
      }
      hook.memoizedState = nextSnapshot;
      var inst = {
        value: nextSnapshot,
        getSnapshot: getSnapshot
      };
      hook.queue = inst;
      mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
      fiber.flags |= Passive;
      pushEffect(HasEffect | Passive$1, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), undefined, null);
      return nextSnapshot;
    }
    function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      var fiber = currentlyRenderingFiber$1;
      var hook = updateWorkInProgressHook();
      var nextSnapshot = getSnapshot();
      {
        if (!didWarnUncachedGetSnapshot) {
          var cachedSnapshot = getSnapshot();
          if (!objectIs(nextSnapshot, cachedSnapshot)) {
            error("The result of getSnapshot should be cached to avoid an infinite loop");
            didWarnUncachedGetSnapshot = true;
          }
        }
      }
      var prevSnapshot = hook.memoizedState;
      var snapshotChanged = !objectIs(prevSnapshot, nextSnapshot);
      if (snapshotChanged) {
        hook.memoizedState = nextSnapshot;
        markWorkInProgressReceivedUpdate();
      }
      var inst = hook.queue;
      updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
      if (inst.getSnapshot !== getSnapshot || snapshotChanged || workInProgressHook !== null && workInProgressHook.memoizedState.tag & HasEffect) {
        fiber.flags |= Passive;
        pushEffect(HasEffect | Passive$1, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), undefined, null);
        var root = getWorkInProgressRoot();
        if (root === null) {
          throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
        }
        if (!includesBlockingLane(root, renderLanes)) {
          pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
        }
      }
      return nextSnapshot;
    }
    function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
      fiber.flags |= StoreConsistency;
      var check = {
        getSnapshot: getSnapshot,
        value: renderedSnapshot
      };
      var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;
      if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
        componentUpdateQueue.stores = [check];
      } else {
        var stores = componentUpdateQueue.stores;
        if (stores === null) {
          componentUpdateQueue.stores = [check];
        } else {
          stores.push(check);
        }
      }
    }
    function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
      inst.value = nextSnapshot;
      inst.getSnapshot = getSnapshot;
      if (checkIfSnapshotChanged(inst)) {
        forceStoreRerender(fiber);
      }
    }
    function subscribeToStore(fiber, inst, subscribe) {
      var handleStoreChange = function handleStoreChange() {
        if (checkIfSnapshotChanged(inst)) {
          forceStoreRerender(fiber);
        }
      };
      return subscribe(handleStoreChange);
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      var prevValue = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(prevValue, nextValue);
      } catch (error) {
        return true;
      }
    }
    function forceStoreRerender(fiber) {
      var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
      if (root !== null) {
        scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
      }
    }
    function mountState(initialState) {
      var hook = mountWorkInProgressHook();
      if (typeof initialState === "function") {
        initialState = initialState();
      }
      hook.memoizedState = hook.baseState = initialState;
      var queue = {
        pending: null,
        interleaved: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: initialState
      };
      hook.queue = queue;
      var dispatch = queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber$1, queue);
      return [hook.memoizedState, dispatch];
    }
    function updateState(initialState) {
      return updateReducer(basicStateReducer);
    }
    function rerenderState(initialState) {
      return rerenderReducer(basicStateReducer);
    }
    function pushEffect(tag, create, destroy, deps) {
      var effect = {
        tag: tag,
        create: create,
        destroy: destroy,
        deps: deps,
        next: null
      };
      var componentUpdateQueue = currentlyRenderingFiber$1.updateQueue;
      if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber$1.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
      } else {
        var lastEffect = componentUpdateQueue.lastEffect;
        if (lastEffect === null) {
          componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
          var firstEffect = lastEffect.next;
          lastEffect.next = effect;
          effect.next = firstEffect;
          componentUpdateQueue.lastEffect = effect;
        }
      }
      return effect;
    }
    function mountRef(initialValue) {
      var hook = mountWorkInProgressHook();
      {
        var _ref2 = {
          current: initialValue
        };
        hook.memoizedState = _ref2;
        return _ref2;
      }
    }
    function updateRef(initialValue) {
      var hook = updateWorkInProgressHook();
      return hook.memoizedState;
    }
    function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = mountWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      currentlyRenderingFiber$1.flags |= fiberFlags;
      hook.memoizedState = pushEffect(HasEffect | hookFlags, create, undefined, nextDeps);
    }
    function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
      var hook = updateWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var destroy = undefined;
      if (currentHook !== null) {
        var prevEffect = currentHook.memoizedState;
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
          var prevDeps = prevEffect.deps;
          if (areHookInputsEqual(nextDeps, prevDeps)) {
            hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
            return;
          }
        }
      }
      currentlyRenderingFiber$1.flags |= fiberFlags;
      hook.memoizedState = pushEffect(HasEffect | hookFlags, create, destroy, nextDeps);
    }
    function mountEffect(create, deps) {
      {
        return mountEffectImpl(Passive | PassiveStatic, Passive$1, create, deps);
      }
    }
    function updateEffect(create, deps) {
      return updateEffectImpl(Passive, Passive$1, create, deps);
    }
    function mountInsertionEffect(create, deps) {
      return mountEffectImpl(Update, Insertion, create, deps);
    }
    function updateInsertionEffect(create, deps) {
      return updateEffectImpl(Update, Insertion, create, deps);
    }
    function mountLayoutEffect(create, deps) {
      var fiberFlags = Update;
      return mountEffectImpl(fiberFlags, Layout, create, deps);
    }
    function updateLayoutEffect(create, deps) {
      return updateEffectImpl(Update, Layout, create, deps);
    }
    function imperativeHandleEffect(create, ref) {
      if (typeof ref === "function") {
        var refCallback = ref;
        var _inst = create();
        refCallback(_inst);
        return function () {
          refCallback(null);
        };
      } else if (ref !== null && ref !== undefined) {
        var refObject = ref;
        {
          if (!refObject.hasOwnProperty("current")) {
            error("Expected useImperativeHandle() first argument to either be a " + "ref callback or React.createRef() object. Instead received: %s.", "an object with keys {" + Object.keys(refObject).join(", ") + "}");
          }
        }
        var _inst2 = create();
        refObject.current = _inst2;
        return function () {
          refObject.current = null;
        };
      }
    }
    function mountImperativeHandle(ref, create, deps) {
      {
        if (typeof create !== "function") {
          error("Expected useImperativeHandle() second argument to be a function " + "that creates a handle. Instead received: %s.", create !== null ? typeof create : "null");
        }
      }
      var effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
      var fiberFlags = Update;
      return mountEffectImpl(fiberFlags, Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
    }
    function updateImperativeHandle(ref, create, deps) {
      {
        if (typeof create !== "function") {
          error("Expected useImperativeHandle() second argument to be a function " + "that creates a handle. Instead received: %s.", create !== null ? typeof create : "null");
        }
      }
      var effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
      return updateEffectImpl(Update, Layout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
    }
    function mountDebugValue(value, formatterFn) {}
    var updateDebugValue = mountDebugValue;
    function mountCallback(callback, deps) {
      var hook = mountWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      hook.memoizedState = [callback, nextDeps];
      return callback;
    }
    function updateCallback(callback, deps) {
      var hook = updateWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var prevState = hook.memoizedState;
      if (prevState !== null) {
        if (nextDeps !== null) {
          var prevDeps = prevState[1];
          if (areHookInputsEqual(nextDeps, prevDeps)) {
            return prevState[0];
          }
        }
      }
      hook.memoizedState = [callback, nextDeps];
      return callback;
    }
    function mountMemo(nextCreate, deps) {
      var hook = mountWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var nextValue = nextCreate();
      hook.memoizedState = [nextValue, nextDeps];
      return nextValue;
    }
    function updateMemo(nextCreate, deps) {
      var hook = updateWorkInProgressHook();
      var nextDeps = deps === undefined ? null : deps;
      var prevState = hook.memoizedState;
      if (prevState !== null) {
        if (nextDeps !== null) {
          var prevDeps = prevState[1];
          if (areHookInputsEqual(nextDeps, prevDeps)) {
            return prevState[0];
          }
        }
      }
      var nextValue = nextCreate();
      hook.memoizedState = [nextValue, nextDeps];
      return nextValue;
    }
    function mountDeferredValue(value) {
      var hook = mountWorkInProgressHook();
      hook.memoizedState = value;
      return value;
    }
    function updateDeferredValue(value) {
      var hook = updateWorkInProgressHook();
      var resolvedCurrentHook = currentHook;
      var prevValue = resolvedCurrentHook.memoizedState;
      return updateDeferredValueImpl(hook, prevValue, value);
    }
    function rerenderDeferredValue(value) {
      var hook = updateWorkInProgressHook();
      if (currentHook === null) {
        hook.memoizedState = value;
        return value;
      } else {
        var prevValue = currentHook.memoizedState;
        return updateDeferredValueImpl(hook, prevValue, value);
      }
    }
    function updateDeferredValueImpl(hook, prevValue, value) {
      var shouldDeferValue = !includesOnlyNonUrgentLanes(renderLanes);
      if (shouldDeferValue) {
        if (!objectIs(value, prevValue)) {
          var deferredLane = claimNextTransitionLane();
          currentlyRenderingFiber$1.lanes = mergeLanes(currentlyRenderingFiber$1.lanes, deferredLane);
          markSkippedUpdateLanes(deferredLane);
          hook.baseState = true;
        }
        return prevValue;
      } else {
        if (hook.baseState) {
          hook.baseState = false;
          markWorkInProgressReceivedUpdate();
        }
        hook.memoizedState = value;
        return value;
      }
    }
    function startTransition(setPending, callback, options) {
      var previousPriority = getCurrentUpdatePriority();
      setCurrentUpdatePriority(higherEventPriority(previousPriority, ContinuousEventPriority));
      setPending(true);
      var prevTransition = ReactCurrentBatchConfig$1.transition;
      ReactCurrentBatchConfig$1.transition = {};
      var currentTransition = ReactCurrentBatchConfig$1.transition;
      {
        ReactCurrentBatchConfig$1.transition._updatedFibers = new Set();
      }
      try {
        setPending(false);
        callback();
      } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig$1.transition = prevTransition;
        {
          if (prevTransition === null && currentTransition._updatedFibers) {
            var updatedFibersCount = currentTransition._updatedFibers.size;
            if (updatedFibersCount > 10) {
              warn("Detected a large number of updates inside startTransition. " + "If this is due to a subscription please re-write it to use React provided hooks. " + "Otherwise concurrent mode guarantees are off the table.");
            }
            currentTransition._updatedFibers.clear();
          }
        }
      }
    }
    function mountTransition() {
      var _mountState = mountState(false),
        isPending = _mountState[0],
        setPending = _mountState[1];
      var start = startTransition.bind(null, setPending);
      var hook = mountWorkInProgressHook();
      hook.memoizedState = start;
      return [isPending, start];
    }
    function updateTransition() {
      var _updateState = updateState(),
        isPending = _updateState[0];
      var hook = updateWorkInProgressHook();
      var start = hook.memoizedState;
      return [isPending, start];
    }
    function rerenderTransition() {
      var _rerenderState = rerenderState(),
        isPending = _rerenderState[0];
      var hook = updateWorkInProgressHook();
      var start = hook.memoizedState;
      return [isPending, start];
    }
    var isUpdatingOpaqueValueInRenderPhase = false;
    function getIsUpdatingOpaqueValueInRenderPhaseInDEV() {
      {
        return isUpdatingOpaqueValueInRenderPhase;
      }
    }
    function mountId() {
      var hook = mountWorkInProgressHook();
      var root = getWorkInProgressRoot();
      var identifierPrefix = root.identifierPrefix;
      var id;
      {
        var globalClientId = globalClientIdCounter++;
        id = ":" + identifierPrefix + "r" + globalClientId.toString(32) + ":";
      }
      hook.memoizedState = id;
      return id;
    }
    function updateId() {
      var hook = updateWorkInProgressHook();
      var id = hook.memoizedState;
      return id;
    }
    function dispatchReducerAction(fiber, queue, action) {
      {
        if (typeof arguments[3] === "function") {
          error("State updates from the useState() and useReducer() Hooks don't support the " + "second callback argument. To execute a side effect after " + "rendering, declare it in the component body with useEffect().");
        }
      }
      var lane = requestUpdateLane(fiber);
      var update = {
        lane: lane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      if (isRenderPhaseUpdate(fiber)) {
        enqueueRenderPhaseUpdate(queue, update);
      } else {
        var root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
        if (root !== null) {
          var eventTime = requestEventTime();
          scheduleUpdateOnFiber(root, fiber, lane, eventTime);
          entangleTransitionUpdate(root, queue, lane);
        }
      }
    }
    function dispatchSetState(fiber, queue, action) {
      {
        if (typeof arguments[3] === "function") {
          error("State updates from the useState() and useReducer() Hooks don't support the " + "second callback argument. To execute a side effect after " + "rendering, declare it in the component body with useEffect().");
        }
      }
      var lane = requestUpdateLane(fiber);
      var update = {
        lane: lane,
        action: action,
        hasEagerState: false,
        eagerState: null,
        next: null
      };
      if (isRenderPhaseUpdate(fiber)) {
        enqueueRenderPhaseUpdate(queue, update);
      } else {
        var alternate = fiber.alternate;
        if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
          var lastRenderedReducer = queue.lastRenderedReducer;
          if (lastRenderedReducer !== null) {
            var prevDispatcher;
            {
              prevDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
            }
            try {
              var currentState = queue.lastRenderedState;
              var eagerState = lastRenderedReducer(currentState, action);
              update.hasEagerState = true;
              update.eagerState = eagerState;
              if (objectIs(eagerState, currentState)) {
                enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update, lane);
                return;
              }
            } catch (error) {} finally {
              {
                ReactCurrentDispatcher$1.current = prevDispatcher;
              }
            }
          }
        }
        var root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
        if (root !== null) {
          var eventTime = requestEventTime();
          scheduleUpdateOnFiber(root, fiber, lane, eventTime);
          entangleTransitionUpdate(root, queue, lane);
        }
      }
    }
    function isRenderPhaseUpdate(fiber) {
      var alternate = fiber.alternate;
      return fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1;
    }
    function enqueueRenderPhaseUpdate(queue, update) {
      didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
      var pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
    function entangleTransitionUpdate(root, queue, lane) {
      if (isTransitionLane(lane)) {
        var queueLanes = queue.lanes;
        queueLanes = intersectLanes(queueLanes, root.pendingLanes);
        var newQueueLanes = mergeLanes(queueLanes, lane);
        queue.lanes = newQueueLanes;
        markRootEntangled(root, newQueueLanes);
      }
    }
    var ContextOnlyDispatcher = {
      readContext: _readContext,
      useCallback: throwInvalidHookError,
      useContext: throwInvalidHookError,
      useEffect: throwInvalidHookError,
      useImperativeHandle: throwInvalidHookError,
      useInsertionEffect: throwInvalidHookError,
      useLayoutEffect: throwInvalidHookError,
      useMemo: throwInvalidHookError,
      useReducer: throwInvalidHookError,
      useRef: throwInvalidHookError,
      useState: throwInvalidHookError,
      useDebugValue: throwInvalidHookError,
      useDeferredValue: throwInvalidHookError,
      useTransition: throwInvalidHookError,
      useMutableSource: throwInvalidHookError,
      useSyncExternalStore: throwInvalidHookError,
      useId: throwInvalidHookError,
      unstable_isNewReconciler: enableNewReconciler
    };
    var HooksDispatcherOnMountInDEV = null;
    var HooksDispatcherOnMountWithHookTypesInDEV = null;
    var HooksDispatcherOnUpdateInDEV = null;
    var HooksDispatcherOnRerenderInDEV = null;
    var InvalidNestedHooksDispatcherOnMountInDEV = null;
    var InvalidNestedHooksDispatcherOnUpdateInDEV = null;
    var InvalidNestedHooksDispatcherOnRerenderInDEV = null;
    {
      var warnInvalidContextAccess = function warnInvalidContextAccess() {
        error("Context can only be read while React is rendering. " + "In classes, you can read it in the render method or getDerivedStateFromProps. " + "In function components, you can read it directly in the function body, but not " + "inside Hooks like useReducer() or useMemo().");
      };
      var warnInvalidHookAccess = function warnInvalidHookAccess() {
        error("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. " + "You can only call Hooks at the top level of your React function. " + "For more information, see " + "https://reactjs.org/link/rules-of-hooks");
      };
      HooksDispatcherOnMountInDEV = {
        readContext: function readContext(context) {
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          mountHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          return mountLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          mountHookTypesDev();
          checkDepsAreArrayDev(deps);
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          mountHookTypesDev();
          return mountRef(initialValue);
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          mountHookTypesDev();
          return mountDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          mountHookTypesDev();
          return mountDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          mountHookTypesDev();
          return mountTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          mountHookTypesDev();
          return mountMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          mountHookTypesDev();
          return mountSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          mountHookTypesDev();
          return mountId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
      HooksDispatcherOnMountWithHookTypesInDEV = {
        readContext: function readContext(context) {
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          updateHookTypesDev();
          return mountCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          updateHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          updateHookTypesDev();
          return mountEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          updateHookTypesDev();
          return mountImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          updateHookTypesDev();
          return mountInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          updateHookTypesDev();
          return mountLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          updateHookTypesDev();
          return mountRef(initialValue);
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          updateHookTypesDev();
          return mountDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          updateHookTypesDev();
          return mountDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          updateHookTypesDev();
          return mountTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          updateHookTypesDev();
          return mountMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          updateHookTypesDev();
          return mountSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          updateHookTypesDev();
          return mountId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
      HooksDispatcherOnUpdateInDEV = {
        readContext: function readContext(context) {
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          updateHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          updateHookTypesDev();
          return updateRef();
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          updateHookTypesDev();
          return updateDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          updateHookTypesDev();
          return updateTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          updateHookTypesDev();
          return updateMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          updateHookTypesDev();
          return updateId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
      HooksDispatcherOnRerenderInDEV = {
        readContext: function readContext(context) {
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          updateHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnRerenderInDEV;
          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnRerenderInDEV;
          try {
            return rerenderReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          updateHookTypesDev();
          return updateRef();
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnRerenderInDEV;
          try {
            return rerenderState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          updateHookTypesDev();
          return rerenderDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          updateHookTypesDev();
          return rerenderTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          updateHookTypesDev();
          return updateMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          updateHookTypesDev();
          return updateId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
      InvalidNestedHooksDispatcherOnMountInDEV = {
        readContext: function readContext(context) {
          warnInvalidContextAccess();
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          warnInvalidHookAccess();
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          warnInvalidHookAccess();
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountRef(initialValue);
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          warnInvalidHookAccess();
          mountHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnMountInDEV;
          try {
            return mountState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          warnInvalidHookAccess();
          mountHookTypesDev();
          return mountId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
      InvalidNestedHooksDispatcherOnUpdateInDEV = {
        readContext: function readContext(context) {
          warnInvalidContextAccess();
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateRef();
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
      InvalidNestedHooksDispatcherOnRerenderInDEV = {
        readContext: function readContext(context) {
          warnInvalidContextAccess();
          return _readContext(context);
        },
        useCallback: function useCallback(callback, deps) {
          currentHookNameInDev = "useCallback";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateCallback(callback, deps);
        },
        useContext: function useContext(context) {
          currentHookNameInDev = "useContext";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return _readContext(context);
        },
        useEffect: function useEffect(create, deps) {
          currentHookNameInDev = "useEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateEffect(create, deps);
        },
        useImperativeHandle: function useImperativeHandle(ref, create, deps) {
          currentHookNameInDev = "useImperativeHandle";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateImperativeHandle(ref, create, deps);
        },
        useInsertionEffect: function useInsertionEffect(create, deps) {
          currentHookNameInDev = "useInsertionEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateInsertionEffect(create, deps);
        },
        useLayoutEffect: function useLayoutEffect(create, deps) {
          currentHookNameInDev = "useLayoutEffect";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateLayoutEffect(create, deps);
        },
        useMemo: function useMemo(create, deps) {
          currentHookNameInDev = "useMemo";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return updateMemo(create, deps);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useReducer: function useReducer(reducer, initialArg, init) {
          currentHookNameInDev = "useReducer";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return rerenderReducer(reducer, initialArg, init);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useRef: function useRef(initialValue) {
          currentHookNameInDev = "useRef";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateRef();
        },
        useState: function useState(initialState) {
          currentHookNameInDev = "useState";
          warnInvalidHookAccess();
          updateHookTypesDev();
          var prevDispatcher = ReactCurrentDispatcher$1.current;
          ReactCurrentDispatcher$1.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
          try {
            return rerenderState(initialState);
          } finally {
            ReactCurrentDispatcher$1.current = prevDispatcher;
          }
        },
        useDebugValue: function useDebugValue(value, formatterFn) {
          currentHookNameInDev = "useDebugValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateDebugValue();
        },
        useDeferredValue: function useDeferredValue(value) {
          currentHookNameInDev = "useDeferredValue";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return rerenderDeferredValue(value);
        },
        useTransition: function useTransition() {
          currentHookNameInDev = "useTransition";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return rerenderTransition();
        },
        useMutableSource: function useMutableSource(source, getSnapshot, subscribe) {
          currentHookNameInDev = "useMutableSource";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateMutableSource();
        },
        useSyncExternalStore: function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          currentHookNameInDev = "useSyncExternalStore";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateSyncExternalStore(subscribe, getSnapshot);
        },
        useId: function useId() {
          currentHookNameInDev = "useId";
          warnInvalidHookAccess();
          updateHookTypesDev();
          return updateId();
        },
        unstable_isNewReconciler: enableNewReconciler
      };
    }
    var now$1 = Scheduler.unstable_now;
    var commitTime = 0;
    var layoutEffectStartTime = -1;
    var profilerStartTime = -1;
    var passiveEffectStartTime = -1;
    var currentUpdateIsNested = false;
    var nestedUpdateScheduled = false;
    function isCurrentUpdateNested() {
      return currentUpdateIsNested;
    }
    function markNestedUpdateScheduled() {
      {
        nestedUpdateScheduled = true;
      }
    }
    function resetNestedUpdateFlag() {
      {
        currentUpdateIsNested = false;
        nestedUpdateScheduled = false;
      }
    }
    function syncNestedUpdateFlag() {
      {
        currentUpdateIsNested = nestedUpdateScheduled;
        nestedUpdateScheduled = false;
      }
    }
    function getCommitTime() {
      return commitTime;
    }
    function recordCommitTime() {
      commitTime = now$1();
    }
    function startProfilerTimer(fiber) {
      profilerStartTime = now$1();
      if (fiber.actualStartTime < 0) {
        fiber.actualStartTime = now$1();
      }
    }
    function stopProfilerTimerIfRunning(fiber) {
      profilerStartTime = -1;
    }
    function stopProfilerTimerIfRunningAndRecordDelta(fiber, overrideBaseTime) {
      if (profilerStartTime >= 0) {
        var elapsedTime = now$1() - profilerStartTime;
        fiber.actualDuration += elapsedTime;
        if (overrideBaseTime) {
          fiber.selfBaseDuration = elapsedTime;
        }
        profilerStartTime = -1;
      }
    }
    function recordLayoutEffectDuration(fiber) {
      if (layoutEffectStartTime >= 0) {
        var elapsedTime = now$1() - layoutEffectStartTime;
        layoutEffectStartTime = -1;
        var parentFiber = fiber.return;
        while (parentFiber !== null) {
          switch (parentFiber.tag) {
            case HostRoot:
              var root = parentFiber.stateNode;
              root.effectDuration += elapsedTime;
              return;
            case Profiler:
              var parentStateNode = parentFiber.stateNode;
              parentStateNode.effectDuration += elapsedTime;
              return;
          }
          parentFiber = parentFiber.return;
        }
      }
    }
    function recordPassiveEffectDuration(fiber) {
      if (passiveEffectStartTime >= 0) {
        var elapsedTime = now$1() - passiveEffectStartTime;
        passiveEffectStartTime = -1;
        var parentFiber = fiber.return;
        while (parentFiber !== null) {
          switch (parentFiber.tag) {
            case HostRoot:
              var root = parentFiber.stateNode;
              if (root !== null) {
                root.passiveEffectDuration += elapsedTime;
              }
              return;
            case Profiler:
              var parentStateNode = parentFiber.stateNode;
              if (parentStateNode !== null) {
                parentStateNode.passiveEffectDuration += elapsedTime;
              }
              return;
          }
          parentFiber = parentFiber.return;
        }
      }
    }
    function startLayoutEffectTimer() {
      layoutEffectStartTime = now$1();
    }
    function startPassiveEffectTimer() {
      passiveEffectStartTime = now$1();
    }
    function transferActualDuration(fiber) {
      var child = fiber.child;
      while (child) {
        fiber.actualDuration += child.actualDuration;
        child = child.sibling;
      }
    }
    function createCapturedValueAtFiber(value, source) {
      return {
        value: value,
        source: source,
        stack: getStackByFiberInDevAndProd(source),
        digest: null
      };
    }
    function createCapturedValue(value, digest, stack) {
      return {
        value: value,
        source: null,
        stack: stack != null ? stack : null,
        digest: digest != null ? digest : null
      };
    }
    if (typeof ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog !== "function") {
      throw new Error("Expected ReactFiberErrorDialog.showErrorDialog to be a function.");
    }
    function showErrorDialog(boundary, errorInfo) {
      var capturedError = {
        componentStack: errorInfo.stack !== null ? errorInfo.stack : "",
        error: errorInfo.value,
        errorBoundary: boundary !== null && boundary.tag === ClassComponent ? boundary.stateNode : null
      };
      return ReactNativePrivateInterface.ReactFiberErrorDialog.showErrorDialog(capturedError);
    }
    function logCapturedError(boundary, errorInfo) {
      try {
        var logError = showErrorDialog(boundary, errorInfo);
        if (logError === false) {
          return;
        }
        var error = errorInfo.value;
        if (true) {
          var source = errorInfo.source;
          var stack = errorInfo.stack;
          var componentStack = stack !== null ? stack : "";
          if (error != null && error._suppressLogging) {
            if (boundary.tag === ClassComponent) {
              return;
            }
            console["error"](error);
          }
          var componentName = source ? getComponentNameFromFiber(source) : null;
          var componentNameMessage = componentName ? "The above error occurred in the <" + componentName + "> component:" : "The above error occurred in one of your React components:";
          var errorBoundaryMessage;
          if (boundary.tag === HostRoot) {
            errorBoundaryMessage = "Consider adding an error boundary to your tree to customize error handling behavior.\n" + "Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.";
          } else {
            var errorBoundaryName = getComponentNameFromFiber(boundary) || "Anonymous";
            errorBoundaryMessage = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + errorBoundaryName + ".");
          }
          var combinedMessage = componentNameMessage + "\n" + componentStack + "\n\n" + ("" + errorBoundaryMessage);
          console["error"](combinedMessage);
        } else {
          console["error"](error);
        }
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    var PossiblyWeakMap$1 = typeof WeakMap === "function" ? WeakMap : Map;
    function createRootErrorUpdate(fiber, errorInfo, lane) {
      var update = createUpdate(NoTimestamp, lane);
      update.tag = CaptureUpdate;
      update.payload = {
        element: null
      };
      var error = errorInfo.value;
      update.callback = function () {
        onUncaughtError(error);
        logCapturedError(fiber, errorInfo);
      };
      return update;
    }
    function createClassErrorUpdate(fiber, errorInfo, lane) {
      var update = createUpdate(NoTimestamp, lane);
      update.tag = CaptureUpdate;
      var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
      if (typeof getDerivedStateFromError === "function") {
        var error$1 = errorInfo.value;
        update.payload = function () {
          return getDerivedStateFromError(error$1);
        };
        update.callback = function () {
          {
            markFailedErrorBoundaryForHotReloading(fiber);
          }
          logCapturedError(fiber, errorInfo);
        };
      }
      var inst = fiber.stateNode;
      if (inst !== null && typeof inst.componentDidCatch === "function") {
        update.callback = function callback() {
          {
            markFailedErrorBoundaryForHotReloading(fiber);
          }
          logCapturedError(fiber, errorInfo);
          if (typeof getDerivedStateFromError !== "function") {
            markLegacyErrorBoundaryAsFailed(this);
          }
          var error$1 = errorInfo.value;
          var stack = errorInfo.stack;
          this.componentDidCatch(error$1, {
            componentStack: stack !== null ? stack : ""
          });
          {
            if (typeof getDerivedStateFromError !== "function") {
              if (!includesSomeLane(fiber.lanes, SyncLane)) {
                error("%s: Error boundaries should implement getDerivedStateFromError(). " + "In that method, return a state update to display an error message or fallback UI.", getComponentNameFromFiber(fiber) || "Unknown");
              }
            }
          }
        };
      }
      return update;
    }
    function attachPingListener(root, wakeable, lanes) {
      var pingCache = root.pingCache;
      var threadIDs;
      if (pingCache === null) {
        pingCache = root.pingCache = new PossiblyWeakMap$1();
        threadIDs = new Set();
        pingCache.set(wakeable, threadIDs);
      } else {
        threadIDs = pingCache.get(wakeable);
        if (threadIDs === undefined) {
          threadIDs = new Set();
          pingCache.set(wakeable, threadIDs);
        }
      }
      if (!threadIDs.has(lanes)) {
        threadIDs.add(lanes);
        var ping = pingSuspendedRoot.bind(null, root, wakeable, lanes);
        {
          if (isDevToolsPresent) {
            restorePendingUpdaters(root, lanes);
          }
        }
        wakeable.then(ping, ping);
      }
    }
    function attachRetryListener(suspenseBoundary, root, wakeable, lanes) {
      var wakeables = suspenseBoundary.updateQueue;
      if (wakeables === null) {
        var updateQueue = new Set();
        updateQueue.add(wakeable);
        suspenseBoundary.updateQueue = updateQueue;
      } else {
        wakeables.add(wakeable);
      }
    }
    function resetSuspendedComponent(sourceFiber, rootRenderLanes) {
      var tag = sourceFiber.tag;
      if ((sourceFiber.mode & ConcurrentMode) === NoMode && (tag === FunctionComponent || tag === ForwardRef || tag === SimpleMemoComponent)) {
        var currentSource = sourceFiber.alternate;
        if (currentSource) {
          sourceFiber.updateQueue = currentSource.updateQueue;
          sourceFiber.memoizedState = currentSource.memoizedState;
          sourceFiber.lanes = currentSource.lanes;
        } else {
          sourceFiber.updateQueue = null;
          sourceFiber.memoizedState = null;
        }
      }
    }
    function getNearestSuspenseBoundaryToCapture(returnFiber) {
      var node = returnFiber;
      do {
        if (node.tag === SuspenseComponent && shouldCaptureSuspense(node)) {
          return node;
        }
        node = node.return;
      } while (node !== null);
      return null;
    }
    function markSuspenseBoundaryShouldCapture(suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes) {
      if ((suspenseBoundary.mode & ConcurrentMode) === NoMode) {
        if (suspenseBoundary === returnFiber) {
          suspenseBoundary.flags |= ShouldCapture;
        } else {
          suspenseBoundary.flags |= DidCapture;
          sourceFiber.flags |= ForceUpdateForLegacySuspense;
          sourceFiber.flags &= ~(LifecycleEffectMask | Incomplete);
          if (sourceFiber.tag === ClassComponent) {
            var currentSourceFiber = sourceFiber.alternate;
            if (currentSourceFiber === null) {
              sourceFiber.tag = IncompleteClassComponent;
            } else {
              var update = createUpdate(NoTimestamp, SyncLane);
              update.tag = ForceUpdate;
              enqueueUpdate(sourceFiber, update, SyncLane);
            }
          }
          sourceFiber.lanes = mergeLanes(sourceFiber.lanes, SyncLane);
        }
        return suspenseBoundary;
      }
      suspenseBoundary.flags |= ShouldCapture;
      suspenseBoundary.lanes = rootRenderLanes;
      return suspenseBoundary;
    }
    function throwException(root, returnFiber, sourceFiber, value, rootRenderLanes) {
      sourceFiber.flags |= Incomplete;
      {
        if (isDevToolsPresent) {
          restorePendingUpdaters(root, rootRenderLanes);
        }
      }
      if (value !== null && typeof value === "object" && typeof value.then === "function") {
        var wakeable = value;
        resetSuspendedComponent(sourceFiber);
        var suspenseBoundary = getNearestSuspenseBoundaryToCapture(returnFiber);
        if (suspenseBoundary !== null) {
          suspenseBoundary.flags &= ~ForceClientRender;
          markSuspenseBoundaryShouldCapture(suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes);
          if (suspenseBoundary.mode & ConcurrentMode) {
            attachPingListener(root, wakeable, rootRenderLanes);
          }
          attachRetryListener(suspenseBoundary, root, wakeable);
          return;
        } else {
          if (!includesSyncLane(rootRenderLanes)) {
            attachPingListener(root, wakeable, rootRenderLanes);
            renderDidSuspendDelayIfPossible();
            return;
          }
          var uncaughtSuspenseError = new Error("A component suspended while responding to synchronous input. This " + "will cause the UI to be replaced with a loading indicator. To " + "fix, updates that suspend should be wrapped " + "with startTransition.");
          value = uncaughtSuspenseError;
        }
      }
      value = createCapturedValueAtFiber(value, sourceFiber);
      renderDidError(value);
      var workInProgress = returnFiber;
      do {
        switch (workInProgress.tag) {
          case HostRoot:
            {
              var _errorInfo = value;
              workInProgress.flags |= ShouldCapture;
              var lane = pickArbitraryLane(rootRenderLanes);
              workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
              var update = createRootErrorUpdate(workInProgress, _errorInfo, lane);
              enqueueCapturedUpdate(workInProgress, update);
              return;
            }
          case ClassComponent:
            var errorInfo = value;
            var ctor = workInProgress.type;
            var instance = workInProgress.stateNode;
            if ((workInProgress.flags & DidCapture) === NoFlags && (typeof ctor.getDerivedStateFromError === "function" || instance !== null && typeof instance.componentDidCatch === "function" && !isAlreadyFailedLegacyErrorBoundary(instance))) {
              workInProgress.flags |= ShouldCapture;
              var _lane = pickArbitraryLane(rootRenderLanes);
              workInProgress.lanes = mergeLanes(workInProgress.lanes, _lane);
              var _update = createClassErrorUpdate(workInProgress, errorInfo, _lane);
              enqueueCapturedUpdate(workInProgress, _update);
              return;
            }
            break;
        }
        workInProgress = workInProgress.return;
      } while (workInProgress !== null);
    }
    function getSuspendedCache() {
      {
        return null;
      }
    }
    var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
    var didReceiveUpdate = false;
    var didWarnAboutBadClass;
    var didWarnAboutModulePatternComponent;
    var didWarnAboutContextTypeOnFunctionComponent;
    var didWarnAboutGetDerivedStateOnFunctionComponent;
    var didWarnAboutFunctionRefs;
    var didWarnAboutReassigningProps;
    var didWarnAboutRevealOrder;
    var didWarnAboutTailOptions;
    {
      didWarnAboutBadClass = {};
      didWarnAboutModulePatternComponent = {};
      didWarnAboutContextTypeOnFunctionComponent = {};
      didWarnAboutGetDerivedStateOnFunctionComponent = {};
      didWarnAboutFunctionRefs = {};
      didWarnAboutReassigningProps = false;
      didWarnAboutRevealOrder = {};
      didWarnAboutTailOptions = {};
    }
    function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
      if (current === null) {
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
      } else {
        workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderLanes);
      }
    }
    function forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderLanes) {
      workInProgress.child = reconcileChildFibers(workInProgress, current.child, null, renderLanes);
      workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderLanes);
    }
    function updateForwardRef(current, workInProgress, Component, nextProps, renderLanes) {
      {
        if (workInProgress.type !== workInProgress.elementType) {
          var innerPropTypes = Component.propTypes;
          if (innerPropTypes) {
            checkPropTypes(innerPropTypes, nextProps, "prop", getComponentNameFromType(Component));
          }
        }
      }
      var render = Component.render;
      var ref = workInProgress.ref;
      var nextChildren;
      prepareToReadContext(workInProgress, renderLanes);
      {
        ReactCurrentOwner$1.current = workInProgress;
        setIsRendering(true);
        nextChildren = renderWithHooks(current, workInProgress, render, nextProps, ref, renderLanes);
        setIsRendering(false);
      }
      if (current !== null && !didReceiveUpdate) {
        bailoutHooks(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function updateMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
      if (current === null) {
        var type = Component.type;
        if (isSimpleFunctionComponent(type) && Component.compare === null && Component.defaultProps === undefined) {
          var resolvedType = type;
          {
            resolvedType = resolveFunctionForHotReloading(type);
          }
          workInProgress.tag = SimpleMemoComponent;
          workInProgress.type = resolvedType;
          {
            validateFunctionComponentInDev(workInProgress, type);
          }
          return updateSimpleMemoComponent(current, workInProgress, resolvedType, nextProps, renderLanes);
        }
        {
          var innerPropTypes = type.propTypes;
          if (innerPropTypes) {
            checkPropTypes(innerPropTypes, nextProps, "prop", getComponentNameFromType(type));
          }
        }
        var child = createFiberFromTypeAndProps(Component.type, null, nextProps, workInProgress, workInProgress.mode, renderLanes);
        child.ref = workInProgress.ref;
        child.return = workInProgress;
        workInProgress.child = child;
        return child;
      }
      {
        var _type = Component.type;
        var _innerPropTypes = _type.propTypes;
        if (_innerPropTypes) {
          checkPropTypes(_innerPropTypes, nextProps, "prop", getComponentNameFromType(_type));
        }
      }
      var currentChild = current.child;
      var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
      if (!hasScheduledUpdateOrContext) {
        var prevProps = currentChild.memoizedProps;
        var compare = Component.compare;
        compare = compare !== null ? compare : shallowEqual;
        if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
        }
      }
      workInProgress.flags |= PerformedWork;
      var newChild = createWorkInProgress(currentChild, nextProps);
      newChild.ref = workInProgress.ref;
      newChild.return = workInProgress;
      workInProgress.child = newChild;
      return newChild;
    }
    function updateSimpleMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
      {
        if (workInProgress.type !== workInProgress.elementType) {
          var outerMemoType = workInProgress.elementType;
          if (outerMemoType.$$typeof === REACT_LAZY_TYPE) {
            var lazyComponent = outerMemoType;
            var payload = lazyComponent._payload;
            var init = lazyComponent._init;
            try {
              outerMemoType = init(payload);
            } catch (x) {
              outerMemoType = null;
            }
            var outerPropTypes = outerMemoType && outerMemoType.propTypes;
            if (outerPropTypes) {
              checkPropTypes(outerPropTypes, nextProps, "prop", getComponentNameFromType(outerMemoType));
            }
          }
        }
      }
      if (current !== null) {
        var prevProps = current.memoizedProps;
        if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress.ref && workInProgress.type === current.type) {
          didReceiveUpdate = false;
          workInProgress.pendingProps = nextProps = prevProps;
          if (!checkScheduledUpdateOrContext(current, renderLanes)) {
            workInProgress.lanes = current.lanes;
            return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
          } else if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
            didReceiveUpdate = true;
          }
        }
      }
      return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes);
    }
    function updateOffscreenComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps;
      var nextChildren = nextProps.children;
      var prevState = current !== null ? current.memoizedState : null;
      if (nextProps.mode === "hidden" || enableLegacyHidden) {
        if ((workInProgress.mode & ConcurrentMode) === NoMode) {
          var nextState = {
            baseLanes: NoLanes,
            cachePool: null,
            transitions: null
          };
          workInProgress.memoizedState = nextState;
          pushRenderLanes(workInProgress, renderLanes);
        } else if (!includesSomeLane(renderLanes, OffscreenLane)) {
          var spawnedCachePool = null;
          var nextBaseLanes;
          if (prevState !== null) {
            var prevBaseLanes = prevState.baseLanes;
            nextBaseLanes = mergeLanes(prevBaseLanes, renderLanes);
          } else {
            nextBaseLanes = renderLanes;
          }
          workInProgress.lanes = workInProgress.childLanes = laneToLanes(OffscreenLane);
          var _nextState = {
            baseLanes: nextBaseLanes,
            cachePool: spawnedCachePool,
            transitions: null
          };
          workInProgress.memoizedState = _nextState;
          workInProgress.updateQueue = null;
          pushRenderLanes(workInProgress, nextBaseLanes);
          return null;
        } else {
          var _nextState2 = {
            baseLanes: NoLanes,
            cachePool: null,
            transitions: null
          };
          workInProgress.memoizedState = _nextState2;
          var subtreeRenderLanes = prevState !== null ? prevState.baseLanes : renderLanes;
          pushRenderLanes(workInProgress, subtreeRenderLanes);
        }
      } else {
        var _subtreeRenderLanes;
        if (prevState !== null) {
          _subtreeRenderLanes = mergeLanes(prevState.baseLanes, renderLanes);
          workInProgress.memoizedState = null;
        } else {
          _subtreeRenderLanes = renderLanes;
        }
        pushRenderLanes(workInProgress, _subtreeRenderLanes);
      }
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function updateFragment(current, workInProgress, renderLanes) {
      var nextChildren = workInProgress.pendingProps;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function updateMode(current, workInProgress, renderLanes) {
      var nextChildren = workInProgress.pendingProps.children;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function updateProfiler(current, workInProgress, renderLanes) {
      {
        workInProgress.flags |= Update;
        {
          var stateNode = workInProgress.stateNode;
          stateNode.effectDuration = 0;
          stateNode.passiveEffectDuration = 0;
        }
      }
      var nextProps = workInProgress.pendingProps;
      var nextChildren = nextProps.children;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function markRef(current, workInProgress) {
      var ref = workInProgress.ref;
      if (current === null && ref !== null || current !== null && current.ref !== ref) {
        workInProgress.flags |= Ref;
      }
    }
    function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
      {
        if (workInProgress.type !== workInProgress.elementType) {
          var innerPropTypes = Component.propTypes;
          if (innerPropTypes) {
            checkPropTypes(innerPropTypes, nextProps, "prop", getComponentNameFromType(Component));
          }
        }
      }
      var context;
      {
        var unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
        context = getMaskedContext(workInProgress, unmaskedContext);
      }
      var nextChildren;
      prepareToReadContext(workInProgress, renderLanes);
      {
        ReactCurrentOwner$1.current = workInProgress;
        setIsRendering(true);
        nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderLanes);
        setIsRendering(false);
      }
      if (current !== null && !didReceiveUpdate) {
        bailoutHooks(current, workInProgress, renderLanes);
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function updateClassComponent(current, workInProgress, Component, nextProps, renderLanes) {
      {
        switch (shouldError(workInProgress)) {
          case false:
            {
              var _instance = workInProgress.stateNode;
              var ctor = workInProgress.type;
              var tempInstance = new ctor(workInProgress.memoizedProps, _instance.context);
              var state = tempInstance.state;
              _instance.updater.enqueueSetState(_instance, state, null);
              break;
            }
          case true:
            {
              workInProgress.flags |= DidCapture;
              workInProgress.flags |= ShouldCapture;
              var error$1 = new Error("Simulated error coming from DevTools");
              var lane = pickArbitraryLane(renderLanes);
              workInProgress.lanes = mergeLanes(workInProgress.lanes, lane);
              var update = createClassErrorUpdate(workInProgress, createCapturedValueAtFiber(error$1, workInProgress), lane);
              enqueueCapturedUpdate(workInProgress, update);
              break;
            }
        }
        if (workInProgress.type !== workInProgress.elementType) {
          var innerPropTypes = Component.propTypes;
          if (innerPropTypes) {
            checkPropTypes(innerPropTypes, nextProps, "prop", getComponentNameFromType(Component));
          }
        }
      }
      var hasContext;
      if (isContextProvider(Component)) {
        hasContext = true;
        pushContextProvider(workInProgress);
      } else {
        hasContext = false;
      }
      prepareToReadContext(workInProgress, renderLanes);
      var instance = workInProgress.stateNode;
      var shouldUpdate;
      if (instance === null) {
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress);
        constructClassInstance(workInProgress, Component, nextProps);
        mountClassInstance(workInProgress, Component, nextProps, renderLanes);
        shouldUpdate = true;
      } else if (current === null) {
        shouldUpdate = resumeMountClassInstance(workInProgress, Component, nextProps, renderLanes);
      } else {
        shouldUpdate = updateClassInstance(current, workInProgress, Component, nextProps, renderLanes);
      }
      var nextUnitOfWork = finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes);
      {
        var inst = workInProgress.stateNode;
        if (shouldUpdate && inst.props !== nextProps) {
          if (!didWarnAboutReassigningProps) {
            error("It looks like %s is reassigning its own `this.props` while rendering. " + "This is not supported and can lead to confusing bugs.", getComponentNameFromFiber(workInProgress) || "a component");
          }
          didWarnAboutReassigningProps = true;
        }
      }
      return nextUnitOfWork;
    }
    function finishClassComponent(current, workInProgress, Component, shouldUpdate, hasContext, renderLanes) {
      markRef(current, workInProgress);
      var didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags;
      if (!shouldUpdate && !didCaptureError) {
        if (hasContext) {
          invalidateContextProvider(workInProgress, Component, false);
        }
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
      var instance = workInProgress.stateNode;
      ReactCurrentOwner$1.current = workInProgress;
      var nextChildren;
      if (didCaptureError && typeof Component.getDerivedStateFromError !== "function") {
        nextChildren = null;
        {
          stopProfilerTimerIfRunning();
        }
      } else {
        {
          setIsRendering(true);
          nextChildren = instance.render();
          setIsRendering(false);
        }
      }
      workInProgress.flags |= PerformedWork;
      if (current !== null && didCaptureError) {
        forceUnmountCurrentAndReconcile(current, workInProgress, nextChildren, renderLanes);
      } else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      }
      workInProgress.memoizedState = instance.state;
      if (hasContext) {
        invalidateContextProvider(workInProgress, Component, true);
      }
      return workInProgress.child;
    }
    function pushHostRootContext(workInProgress) {
      var root = workInProgress.stateNode;
      if (root.pendingContext) {
        pushTopLevelContextObject(workInProgress, root.pendingContext, root.pendingContext !== root.context);
      } else if (root.context) {
        pushTopLevelContextObject(workInProgress, root.context, false);
      }
      pushHostContainer(workInProgress, root.containerInfo);
    }
    function updateHostRoot(current, workInProgress, renderLanes) {
      pushHostRootContext(workInProgress);
      if (current === null) {
        throw new Error("Should have a current fiber. This is a bug in React.");
      }
      var nextProps = workInProgress.pendingProps;
      var prevState = workInProgress.memoizedState;
      var prevChildren = prevState.element;
      cloneUpdateQueue(current, workInProgress);
      processUpdateQueue(workInProgress, nextProps, null, renderLanes);
      var nextState = workInProgress.memoizedState;
      var root = workInProgress.stateNode;
      var nextChildren = nextState.element;
      {
        if (nextChildren === prevChildren) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
        }
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      }
      return workInProgress.child;
    }
    function updateHostComponent(current, workInProgress, renderLanes) {
      pushHostContext(workInProgress);
      var type = workInProgress.type;
      var nextProps = workInProgress.pendingProps;
      var prevProps = current !== null ? current.memoizedProps : null;
      var nextChildren = nextProps.children;
      if (prevProps !== null && shouldSetTextContent()) {
        workInProgress.flags |= ContentReset;
      }
      markRef(current, workInProgress);
      reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      return workInProgress.child;
    }
    function updateHostText(current, workInProgress) {
      return null;
    }
    function mountLazyComponent(_current, workInProgress, elementType, renderLanes) {
      resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
      var props = workInProgress.pendingProps;
      var lazyComponent = elementType;
      var payload = lazyComponent._payload;
      var init = lazyComponent._init;
      var Component = init(payload);
      workInProgress.type = Component;
      var resolvedTag = workInProgress.tag = resolveLazyComponentTag(Component);
      var resolvedProps = resolveDefaultProps(Component, props);
      var child;
      switch (resolvedTag) {
        case FunctionComponent:
          {
            {
              validateFunctionComponentInDev(workInProgress, Component);
              workInProgress.type = Component = resolveFunctionForHotReloading(Component);
            }
            child = updateFunctionComponent(null, workInProgress, Component, resolvedProps, renderLanes);
            return child;
          }
        case ClassComponent:
          {
            {
              workInProgress.type = Component = resolveClassForHotReloading(Component);
            }
            child = updateClassComponent(null, workInProgress, Component, resolvedProps, renderLanes);
            return child;
          }
        case ForwardRef:
          {
            {
              workInProgress.type = Component = resolveForwardRefForHotReloading(Component);
            }
            child = updateForwardRef(null, workInProgress, Component, resolvedProps, renderLanes);
            return child;
          }
        case MemoComponent:
          {
            {
              if (workInProgress.type !== workInProgress.elementType) {
                var outerPropTypes = Component.propTypes;
                if (outerPropTypes) {
                  checkPropTypes(outerPropTypes, resolvedProps, "prop", getComponentNameFromType(Component));
                }
              }
            }
            child = updateMemoComponent(null, workInProgress, Component, resolveDefaultProps(Component.type, resolvedProps), renderLanes);
            return child;
          }
      }
      var hint = "";
      {
        if (Component !== null && typeof Component === "object" && Component.$$typeof === REACT_LAZY_TYPE) {
          hint = " Did you wrap a component in React.lazy() more than once?";
        }
      }
      throw new Error("Element type is invalid. Received a promise that resolves to: " + Component + ". " + ("Lazy element type must resolve to a class or function." + hint));
    }
    function mountIncompleteClassComponent(_current, workInProgress, Component, nextProps, renderLanes) {
      resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
      workInProgress.tag = ClassComponent;
      var hasContext;
      if (isContextProvider(Component)) {
        hasContext = true;
        pushContextProvider(workInProgress);
      } else {
        hasContext = false;
      }
      prepareToReadContext(workInProgress, renderLanes);
      constructClassInstance(workInProgress, Component, nextProps);
      mountClassInstance(workInProgress, Component, nextProps, renderLanes);
      return finishClassComponent(null, workInProgress, Component, true, hasContext, renderLanes);
    }
    function mountIndeterminateComponent(_current, workInProgress, Component, renderLanes) {
      resetSuspendedCurrentOnMountInLegacyMode(_current, workInProgress);
      var props = workInProgress.pendingProps;
      var context;
      {
        var unmaskedContext = getUnmaskedContext(workInProgress, Component, false);
        context = getMaskedContext(workInProgress, unmaskedContext);
      }
      prepareToReadContext(workInProgress, renderLanes);
      var value;
      {
        if (Component.prototype && typeof Component.prototype.render === "function") {
          var componentName = getComponentNameFromType(Component) || "Unknown";
          if (!didWarnAboutBadClass[componentName]) {
            error("The <%s /> component appears to have a render method, but doesn't extend React.Component. " + "This is likely to cause errors. Change %s to extend React.Component instead.", componentName, componentName);
            didWarnAboutBadClass[componentName] = true;
          }
        }
        if (workInProgress.mode & StrictLegacyMode) {
          ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, null);
        }
        setIsRendering(true);
        ReactCurrentOwner$1.current = workInProgress;
        value = renderWithHooks(null, workInProgress, Component, props, context, renderLanes);
        setIsRendering(false);
      }
      workInProgress.flags |= PerformedWork;
      {
        if (typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === undefined) {
          var _componentName = getComponentNameFromType(Component) || "Unknown";
          if (!didWarnAboutModulePatternComponent[_componentName]) {
            error("The <%s /> component appears to be a function component that returns a class instance. " + "Change %s to a class that extends React.Component instead. " + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + "cannot be called with `new` by React.", _componentName, _componentName, _componentName);
            didWarnAboutModulePatternComponent[_componentName] = true;
          }
        }
      }
      if (typeof value === "object" && value !== null && typeof value.render === "function" && value.$$typeof === undefined) {
        {
          var _componentName2 = getComponentNameFromType(Component) || "Unknown";
          if (!didWarnAboutModulePatternComponent[_componentName2]) {
            error("The <%s /> component appears to be a function component that returns a class instance. " + "Change %s to a class that extends React.Component instead. " + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + "cannot be called with `new` by React.", _componentName2, _componentName2, _componentName2);
            didWarnAboutModulePatternComponent[_componentName2] = true;
          }
        }
        workInProgress.tag = ClassComponent;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        var hasContext = false;
        if (isContextProvider(Component)) {
          hasContext = true;
          pushContextProvider(workInProgress);
        } else {
          hasContext = false;
        }
        workInProgress.memoizedState = value.state !== null && value.state !== undefined ? value.state : null;
        initializeUpdateQueue(workInProgress);
        adoptClassInstance(workInProgress, value);
        mountClassInstance(workInProgress, Component, props, renderLanes);
        return finishClassComponent(null, workInProgress, Component, true, hasContext, renderLanes);
      } else {
        workInProgress.tag = FunctionComponent;
        reconcileChildren(null, workInProgress, value, renderLanes);
        {
          validateFunctionComponentInDev(workInProgress, Component);
        }
        return workInProgress.child;
      }
    }
    function validateFunctionComponentInDev(workInProgress, Component) {
      {
        if (Component) {
          if (Component.childContextTypes) {
            error("%s(...): childContextTypes cannot be defined on a function component.", Component.displayName || Component.name || "Component");
          }
        }
        if (workInProgress.ref !== null) {
          var info = "";
          var ownerName = getCurrentFiberOwnerNameInDevOrNull();
          if (ownerName) {
            info += "\n\nCheck the render method of `" + ownerName + "`.";
          }
          var warningKey = ownerName || "";
          var debugSource = workInProgress._debugSource;
          if (debugSource) {
            warningKey = debugSource.fileName + ":" + debugSource.lineNumber;
          }
          if (!didWarnAboutFunctionRefs[warningKey]) {
            didWarnAboutFunctionRefs[warningKey] = true;
            error("Function components cannot be given refs. " + "Attempts to access this ref will fail. " + "Did you mean to use React.forwardRef()?%s", info);
          }
        }
        if (typeof Component.getDerivedStateFromProps === "function") {
          var _componentName3 = getComponentNameFromType(Component) || "Unknown";
          if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3]) {
            error("%s: Function components do not support getDerivedStateFromProps.", _componentName3);
            didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3] = true;
          }
        }
        if (typeof Component.contextType === "object" && Component.contextType !== null) {
          var _componentName4 = getComponentNameFromType(Component) || "Unknown";
          if (!didWarnAboutContextTypeOnFunctionComponent[_componentName4]) {
            error("%s: Function components do not support contextType.", _componentName4);
            didWarnAboutContextTypeOnFunctionComponent[_componentName4] = true;
          }
        }
      }
    }
    var SUSPENDED_MARKER = {
      dehydrated: null,
      treeContext: null,
      retryLane: NoLane
    };
    function mountSuspenseOffscreenState(renderLanes) {
      return {
        baseLanes: renderLanes,
        cachePool: getSuspendedCache(),
        transitions: null
      };
    }
    function updateSuspenseOffscreenState(prevOffscreenState, renderLanes) {
      var cachePool = null;
      return {
        baseLanes: mergeLanes(prevOffscreenState.baseLanes, renderLanes),
        cachePool: cachePool,
        transitions: prevOffscreenState.transitions
      };
    }
    function shouldRemainOnFallback(suspenseContext, current, workInProgress, renderLanes) {
      if (current !== null) {
        var suspenseState = current.memoizedState;
        if (suspenseState === null) {
          return false;
        }
      }
      return hasSuspenseContext(suspenseContext, ForceSuspenseFallback);
    }
    function getRemainingWorkInPrimaryTree(current, renderLanes) {
      return removeLanes(current.childLanes, renderLanes);
    }
    function updateSuspenseComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps;
      {
        if (shouldSuspend(workInProgress)) {
          workInProgress.flags |= DidCapture;
        }
      }
      var suspenseContext = suspenseStackCursor.current;
      var showFallback = false;
      var didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
      if (didSuspend || shouldRemainOnFallback(suspenseContext, current)) {
        showFallback = true;
        workInProgress.flags &= ~DidCapture;
      } else {
        if (current === null || current.memoizedState !== null) {
          {
            suspenseContext = addSubtreeSuspenseContext(suspenseContext, InvisibleParentSuspenseContext);
          }
        }
      }
      suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
      pushSuspenseContext(workInProgress, suspenseContext);
      if (current === null) {
        var suspenseState = workInProgress.memoizedState;
        if (suspenseState !== null) {
          var dehydrated = suspenseState.dehydrated;
          if (dehydrated !== null) {
            return mountDehydratedSuspenseComponent(workInProgress);
          }
        }
        var nextPrimaryChildren = nextProps.children;
        var nextFallbackChildren = nextProps.fallback;
        if (showFallback) {
          var fallbackFragment = mountSuspenseFallbackChildren(workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
          var primaryChildFragment = workInProgress.child;
          primaryChildFragment.memoizedState = mountSuspenseOffscreenState(renderLanes);
          workInProgress.memoizedState = SUSPENDED_MARKER;
          return fallbackFragment;
        } else {
          return mountSuspensePrimaryChildren(workInProgress, nextPrimaryChildren);
        }
      } else {
        var prevState = current.memoizedState;
        if (prevState !== null) {
          var _dehydrated = prevState.dehydrated;
          if (_dehydrated !== null) {
            return updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, nextProps, _dehydrated, prevState, renderLanes);
          }
        }
        if (showFallback) {
          var _nextFallbackChildren = nextProps.fallback;
          var _nextPrimaryChildren = nextProps.children;
          var fallbackChildFragment = updateSuspenseFallbackChildren(current, workInProgress, _nextPrimaryChildren, _nextFallbackChildren, renderLanes);
          var _primaryChildFragment2 = workInProgress.child;
          var prevOffscreenState = current.child.memoizedState;
          _primaryChildFragment2.memoizedState = prevOffscreenState === null ? mountSuspenseOffscreenState(renderLanes) : updateSuspenseOffscreenState(prevOffscreenState, renderLanes);
          _primaryChildFragment2.childLanes = getRemainingWorkInPrimaryTree(current, renderLanes);
          workInProgress.memoizedState = SUSPENDED_MARKER;
          return fallbackChildFragment;
        } else {
          var _nextPrimaryChildren2 = nextProps.children;
          var _primaryChildFragment3 = updateSuspensePrimaryChildren(current, workInProgress, _nextPrimaryChildren2, renderLanes);
          workInProgress.memoizedState = null;
          return _primaryChildFragment3;
        }
      }
    }
    function mountSuspensePrimaryChildren(workInProgress, primaryChildren, renderLanes) {
      var mode = workInProgress.mode;
      var primaryChildProps = {
        mode: "visible",
        children: primaryChildren
      };
      var primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, mode);
      primaryChildFragment.return = workInProgress;
      workInProgress.child = primaryChildFragment;
      return primaryChildFragment;
    }
    function mountSuspenseFallbackChildren(workInProgress, primaryChildren, fallbackChildren, renderLanes) {
      var mode = workInProgress.mode;
      var progressedPrimaryFragment = workInProgress.child;
      var primaryChildProps = {
        mode: "hidden",
        children: primaryChildren
      };
      var primaryChildFragment;
      var fallbackChildFragment;
      if ((mode & ConcurrentMode) === NoMode && progressedPrimaryFragment !== null) {
        primaryChildFragment = progressedPrimaryFragment;
        primaryChildFragment.childLanes = NoLanes;
        primaryChildFragment.pendingProps = primaryChildProps;
        if (workInProgress.mode & ProfileMode) {
          primaryChildFragment.actualDuration = 0;
          primaryChildFragment.actualStartTime = -1;
          primaryChildFragment.selfBaseDuration = 0;
          primaryChildFragment.treeBaseDuration = 0;
        }
        fallbackChildFragment = createFiberFromFragment(fallbackChildren, mode, renderLanes, null);
      } else {
        primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, mode);
        fallbackChildFragment = createFiberFromFragment(fallbackChildren, mode, renderLanes, null);
      }
      primaryChildFragment.return = workInProgress;
      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment;
      workInProgress.child = primaryChildFragment;
      return fallbackChildFragment;
    }
    function mountWorkInProgressOffscreenFiber(offscreenProps, mode, renderLanes) {
      return createFiberFromOffscreen(offscreenProps, mode, NoLanes, null);
    }
    function updateWorkInProgressOffscreenFiber(current, offscreenProps) {
      return createWorkInProgress(current, offscreenProps);
    }
    function updateSuspensePrimaryChildren(current, workInProgress, primaryChildren, renderLanes) {
      var currentPrimaryChildFragment = current.child;
      var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
      var primaryChildFragment = updateWorkInProgressOffscreenFiber(currentPrimaryChildFragment, {
        mode: "visible",
        children: primaryChildren
      });
      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        primaryChildFragment.lanes = renderLanes;
      }
      primaryChildFragment.return = workInProgress;
      primaryChildFragment.sibling = null;
      if (currentFallbackChildFragment !== null) {
        var deletions = workInProgress.deletions;
        if (deletions === null) {
          workInProgress.deletions = [currentFallbackChildFragment];
          workInProgress.flags |= ChildDeletion;
        } else {
          deletions.push(currentFallbackChildFragment);
        }
      }
      workInProgress.child = primaryChildFragment;
      return primaryChildFragment;
    }
    function updateSuspenseFallbackChildren(current, workInProgress, primaryChildren, fallbackChildren, renderLanes) {
      var mode = workInProgress.mode;
      var currentPrimaryChildFragment = current.child;
      var currentFallbackChildFragment = currentPrimaryChildFragment.sibling;
      var primaryChildProps = {
        mode: "hidden",
        children: primaryChildren
      };
      var primaryChildFragment;
      if ((mode & ConcurrentMode) === NoMode && workInProgress.child !== currentPrimaryChildFragment) {
        var progressedPrimaryFragment = workInProgress.child;
        primaryChildFragment = progressedPrimaryFragment;
        primaryChildFragment.childLanes = NoLanes;
        primaryChildFragment.pendingProps = primaryChildProps;
        if (workInProgress.mode & ProfileMode) {
          primaryChildFragment.actualDuration = 0;
          primaryChildFragment.actualStartTime = -1;
          primaryChildFragment.selfBaseDuration = currentPrimaryChildFragment.selfBaseDuration;
          primaryChildFragment.treeBaseDuration = currentPrimaryChildFragment.treeBaseDuration;
        }
        workInProgress.deletions = null;
      } else {
        primaryChildFragment = updateWorkInProgressOffscreenFiber(currentPrimaryChildFragment, primaryChildProps);
        primaryChildFragment.subtreeFlags = currentPrimaryChildFragment.subtreeFlags & StaticMask;
      }
      var fallbackChildFragment;
      if (currentFallbackChildFragment !== null) {
        fallbackChildFragment = createWorkInProgress(currentFallbackChildFragment, fallbackChildren);
      } else {
        fallbackChildFragment = createFiberFromFragment(fallbackChildren, mode, renderLanes, null);
        fallbackChildFragment.flags |= Placement;
      }
      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment;
      workInProgress.child = primaryChildFragment;
      return fallbackChildFragment;
    }
    function retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, recoverableError) {
      if (recoverableError !== null) {
        queueHydrationError(recoverableError);
      }
      reconcileChildFibers(workInProgress, current.child, null, renderLanes);
      var nextProps = workInProgress.pendingProps;
      var primaryChildren = nextProps.children;
      var primaryChildFragment = mountSuspensePrimaryChildren(workInProgress, primaryChildren);
      primaryChildFragment.flags |= Placement;
      workInProgress.memoizedState = null;
      return primaryChildFragment;
    }
    function mountSuspenseFallbackAfterRetryWithoutHydrating(current, workInProgress, primaryChildren, fallbackChildren, renderLanes) {
      var fiberMode = workInProgress.mode;
      var primaryChildProps = {
        mode: "visible",
        children: primaryChildren
      };
      var primaryChildFragment = mountWorkInProgressOffscreenFiber(primaryChildProps, fiberMode);
      var fallbackChildFragment = createFiberFromFragment(fallbackChildren, fiberMode, renderLanes, null);
      fallbackChildFragment.flags |= Placement;
      primaryChildFragment.return = workInProgress;
      fallbackChildFragment.return = workInProgress;
      primaryChildFragment.sibling = fallbackChildFragment;
      workInProgress.child = primaryChildFragment;
      if ((workInProgress.mode & ConcurrentMode) !== NoMode) {
        reconcileChildFibers(workInProgress, current.child, null, renderLanes);
      }
      return fallbackChildFragment;
    }
    function mountDehydratedSuspenseComponent(workInProgress, suspenseInstance, renderLanes) {
      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        {
          error("Cannot hydrate Suspense in legacy mode. Switch from " + "ReactDOM.hydrate(element, container) to " + "ReactDOMClient.hydrateRoot(container, <App />)" + ".render(element) or remove the Suspense components from " + "the server rendered components.");
        }
        workInProgress.lanes = laneToLanes(SyncLane);
      } else if (isSuspenseInstanceFallback()) {
        workInProgress.lanes = laneToLanes(DefaultHydrationLane);
      } else {
        workInProgress.lanes = laneToLanes(OffscreenLane);
      }
      return null;
    }
    function updateDehydratedSuspenseComponent(current, workInProgress, didSuspend, nextProps, suspenseInstance, suspenseState, renderLanes) {
      if (!didSuspend) {
        if ((workInProgress.mode & ConcurrentMode) === NoMode) {
          return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, null);
        }
        if (isSuspenseInstanceFallback()) {
          var digest, message, stack;
          {
            var _getSuspenseInstanceF = getSuspenseInstanceFallbackErrorDetails();
            digest = _getSuspenseInstanceF.digest;
            message = _getSuspenseInstanceF.message;
            stack = _getSuspenseInstanceF.stack;
          }
          var error;
          if (message) {
            error = new Error(message);
          } else {
            error = new Error("The server could not finish this Suspense boundary, likely " + "due to an error during server rendering. Switched to " + "client rendering.");
          }
          var capturedValue = createCapturedValue(error, digest, stack);
          return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, capturedValue);
        }
        var hasContextChanged = includesSomeLane(renderLanes, current.childLanes);
        if (didReceiveUpdate || hasContextChanged) {
          var root = getWorkInProgressRoot();
          if (root !== null) {
            var attemptHydrationAtLane = getBumpedLaneForHydration(root, renderLanes);
            if (attemptHydrationAtLane !== NoLane && attemptHydrationAtLane !== suspenseState.retryLane) {
              suspenseState.retryLane = attemptHydrationAtLane;
              var eventTime = NoTimestamp;
              enqueueConcurrentRenderForLane(current, attemptHydrationAtLane);
              scheduleUpdateOnFiber(root, current, attemptHydrationAtLane, eventTime);
            }
          }
          renderDidSuspendDelayIfPossible();
          var _capturedValue = createCapturedValue(new Error("This Suspense boundary received an update before it finished " + "hydrating. This caused the boundary to switch to client rendering. " + "The usual way to fix this is to wrap the original update " + "in startTransition."));
          return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, _capturedValue);
        } else if (isSuspenseInstancePending()) {
          workInProgress.flags |= DidCapture;
          workInProgress.child = current.child;
          var retry = retryDehydratedSuspenseBoundary.bind(null, current);
          registerSuspenseInstanceRetry();
          return null;
        } else {
          reenterHydrationStateFromDehydratedSuspenseInstance(workInProgress, suspenseInstance, suspenseState.treeContext);
          var primaryChildren = nextProps.children;
          var primaryChildFragment = mountSuspensePrimaryChildren(workInProgress, primaryChildren);
          primaryChildFragment.flags |= Hydrating;
          return primaryChildFragment;
        }
      } else {
        if (workInProgress.flags & ForceClientRender) {
          workInProgress.flags &= ~ForceClientRender;
          var _capturedValue2 = createCapturedValue(new Error("There was an error while hydrating this Suspense boundary. " + "Switched to client rendering."));
          return retrySuspenseComponentWithoutHydrating(current, workInProgress, renderLanes, _capturedValue2);
        } else if (workInProgress.memoizedState !== null) {
          workInProgress.child = current.child;
          workInProgress.flags |= DidCapture;
          return null;
        } else {
          var nextPrimaryChildren = nextProps.children;
          var nextFallbackChildren = nextProps.fallback;
          var fallbackChildFragment = mountSuspenseFallbackAfterRetryWithoutHydrating(current, workInProgress, nextPrimaryChildren, nextFallbackChildren, renderLanes);
          var _primaryChildFragment4 = workInProgress.child;
          _primaryChildFragment4.memoizedState = mountSuspenseOffscreenState(renderLanes);
          workInProgress.memoizedState = SUSPENDED_MARKER;
          return fallbackChildFragment;
        }
      }
    }
    function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
      fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
      var alternate = fiber.alternate;
      if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
      }
      scheduleContextWorkOnParentPath(fiber.return, renderLanes, propagationRoot);
    }
    function propagateSuspenseContextChange(workInProgress, firstChild, renderLanes) {
      var node = firstChild;
      while (node !== null) {
        if (node.tag === SuspenseComponent) {
          var state = node.memoizedState;
          if (state !== null) {
            scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
          }
        } else if (node.tag === SuspenseListComponent) {
          scheduleSuspenseWorkOnFiber(node, renderLanes, workInProgress);
        } else if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }
        if (node === workInProgress) {
          return;
        }
        while (node.sibling === null) {
          if (node.return === null || node.return === workInProgress) {
            return;
          }
          node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
      }
    }
    function findLastContentRow(firstChild) {
      var row = firstChild;
      var lastContentRow = null;
      while (row !== null) {
        var currentRow = row.alternate;
        if (currentRow !== null && findFirstSuspended(currentRow) === null) {
          lastContentRow = row;
        }
        row = row.sibling;
      }
      return lastContentRow;
    }
    function validateRevealOrder(revealOrder) {
      {
        if (revealOrder !== undefined && revealOrder !== "forwards" && revealOrder !== "backwards" && revealOrder !== "together" && !didWarnAboutRevealOrder[revealOrder]) {
          didWarnAboutRevealOrder[revealOrder] = true;
          if (typeof revealOrder === "string") {
            switch (revealOrder.toLowerCase()) {
              case "together":
              case "forwards":
              case "backwards":
                {
                  error('"%s" is not a valid value for revealOrder on <SuspenseList />. ' + 'Use lowercase "%s" instead.', revealOrder, revealOrder.toLowerCase());
                  break;
                }
              case "forward":
              case "backward":
                {
                  error('"%s" is not a valid value for revealOrder on <SuspenseList />. ' + 'React uses the -s suffix in the spelling. Use "%ss" instead.', revealOrder, revealOrder.toLowerCase());
                  break;
                }
              default:
                error('"%s" is not a supported revealOrder on <SuspenseList />. ' + 'Did you mean "together", "forwards" or "backwards"?', revealOrder);
                break;
            }
          } else {
            error("%s is not a supported value for revealOrder on <SuspenseList />. " + 'Did you mean "together", "forwards" or "backwards"?', revealOrder);
          }
        }
      }
    }
    function validateTailOptions(tailMode, revealOrder) {
      {
        if (tailMode !== undefined && !didWarnAboutTailOptions[tailMode]) {
          if (tailMode !== "collapsed" && tailMode !== "hidden") {
            didWarnAboutTailOptions[tailMode] = true;
            error('"%s" is not a supported value for tail on <SuspenseList />. ' + 'Did you mean "collapsed" or "hidden"?', tailMode);
          } else if (revealOrder !== "forwards" && revealOrder !== "backwards") {
            didWarnAboutTailOptions[tailMode] = true;
            error('<SuspenseList tail="%s" /> is only valid if revealOrder is ' + '"forwards" or "backwards". ' + 'Did you mean to specify revealOrder="forwards"?', tailMode);
          }
        }
      }
    }
    function validateSuspenseListNestedChild(childSlot, index) {
      {
        var isAnArray = isArray(childSlot);
        var isIterable = !isAnArray && typeof getIteratorFn(childSlot) === "function";
        if (isAnArray || isIterable) {
          var type = isAnArray ? "array" : "iterable";
          error("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in " + "an additional SuspenseList to configure its revealOrder: " + "<SuspenseList revealOrder=...> ... " + "<SuspenseList revealOrder=...>{%s}</SuspenseList> ... " + "</SuspenseList>", type, index, type);
          return false;
        }
      }
      return true;
    }
    function validateSuspenseListChildren(children, revealOrder) {
      {
        if ((revealOrder === "forwards" || revealOrder === "backwards") && children !== undefined && children !== null && children !== false) {
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              if (!validateSuspenseListNestedChild(children[i], i)) {
                return;
              }
            }
          } else {
            var iteratorFn = getIteratorFn(children);
            if (typeof iteratorFn === "function") {
              var childrenIterator = iteratorFn.call(children);
              if (childrenIterator) {
                var step = childrenIterator.next();
                var _i = 0;
                for (; !step.done; step = childrenIterator.next()) {
                  if (!validateSuspenseListNestedChild(step.value, _i)) {
                    return;
                  }
                  _i++;
                }
              }
            } else {
              error('A single row was passed to a <SuspenseList revealOrder="%s" />. ' + "This is not useful since it needs multiple rows. " + "Did you mean to pass multiple children or an array?", revealOrder);
            }
          }
        }
      }
    }
    function initSuspenseListRenderState(workInProgress, isBackwards, tail, lastContentRow, tailMode) {
      var renderState = workInProgress.memoizedState;
      if (renderState === null) {
        workInProgress.memoizedState = {
          isBackwards: isBackwards,
          rendering: null,
          renderingStartTime: 0,
          last: lastContentRow,
          tail: tail,
          tailMode: tailMode
        };
      } else {
        renderState.isBackwards = isBackwards;
        renderState.rendering = null;
        renderState.renderingStartTime = 0;
        renderState.last = lastContentRow;
        renderState.tail = tail;
        renderState.tailMode = tailMode;
      }
    }
    function updateSuspenseListComponent(current, workInProgress, renderLanes) {
      var nextProps = workInProgress.pendingProps;
      var revealOrder = nextProps.revealOrder;
      var tailMode = nextProps.tail;
      var newChildren = nextProps.children;
      validateRevealOrder(revealOrder);
      validateTailOptions(tailMode, revealOrder);
      validateSuspenseListChildren(newChildren, revealOrder);
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      var suspenseContext = suspenseStackCursor.current;
      var shouldForceFallback = hasSuspenseContext(suspenseContext, ForceSuspenseFallback);
      if (shouldForceFallback) {
        suspenseContext = setShallowSuspenseContext(suspenseContext, ForceSuspenseFallback);
        workInProgress.flags |= DidCapture;
      } else {
        var didSuspendBefore = current !== null && (current.flags & DidCapture) !== NoFlags;
        if (didSuspendBefore) {
          propagateSuspenseContextChange(workInProgress, workInProgress.child, renderLanes);
        }
        suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
      }
      pushSuspenseContext(workInProgress, suspenseContext);
      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        workInProgress.memoizedState = null;
      } else {
        switch (revealOrder) {
          case "forwards":
            {
              var lastContentRow = findLastContentRow(workInProgress.child);
              var tail;
              if (lastContentRow === null) {
                tail = workInProgress.child;
                workInProgress.child = null;
              } else {
                tail = lastContentRow.sibling;
                lastContentRow.sibling = null;
              }
              initSuspenseListRenderState(workInProgress, false, tail, lastContentRow, tailMode);
              break;
            }
          case "backwards":
            {
              var _tail = null;
              var row = workInProgress.child;
              workInProgress.child = null;
              while (row !== null) {
                var currentRow = row.alternate;
                if (currentRow !== null && findFirstSuspended(currentRow) === null) {
                  workInProgress.child = row;
                  break;
                }
                var nextRow = row.sibling;
                row.sibling = _tail;
                _tail = row;
                row = nextRow;
              }
              initSuspenseListRenderState(workInProgress, true, _tail, null, tailMode);
              break;
            }
          case "together":
            {
              initSuspenseListRenderState(workInProgress, false, null, null, undefined);
              break;
            }
          default:
            {
              workInProgress.memoizedState = null;
            }
        }
      }
      return workInProgress.child;
    }
    function updatePortalComponent(current, workInProgress, renderLanes) {
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      var nextChildren = workInProgress.pendingProps;
      if (current === null) {
        workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderLanes);
      } else {
        reconcileChildren(current, workInProgress, nextChildren, renderLanes);
      }
      return workInProgress.child;
    }
    var hasWarnedAboutUsingNoValuePropOnContextProvider = false;
    function updateContextProvider(current, workInProgress, renderLanes) {
      var providerType = workInProgress.type;
      var context = providerType._context;
      var newProps = workInProgress.pendingProps;
      var oldProps = workInProgress.memoizedProps;
      var newValue = newProps.value;
      {
        if (!("value" in newProps)) {
          if (!hasWarnedAboutUsingNoValuePropOnContextProvider) {
            hasWarnedAboutUsingNoValuePropOnContextProvider = true;
            error("The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?");
          }
        }
        var providerPropTypes = workInProgress.type.propTypes;
        if (providerPropTypes) {
          checkPropTypes(providerPropTypes, newProps, "prop", "Context.Provider");
        }
      }
      pushProvider(workInProgress, context, newValue);
      {
        if (oldProps !== null) {
          var oldValue = oldProps.value;
          if (objectIs(oldValue, newValue)) {
            if (oldProps.children === newProps.children && !hasContextChanged()) {
              return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
            }
          } else {
            propagateContextChange(workInProgress, context, renderLanes);
          }
        }
      }
      var newChildren = newProps.children;
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      return workInProgress.child;
    }
    var hasWarnedAboutUsingContextAsConsumer = false;
    function updateContextConsumer(current, workInProgress, renderLanes) {
      var context = workInProgress.type;
      {
        if (context._context === undefined) {
          if (context !== context.Consumer) {
            if (!hasWarnedAboutUsingContextAsConsumer) {
              hasWarnedAboutUsingContextAsConsumer = true;
              error("Rendering <Context> directly is not supported and will be removed in " + "a future major release. Did you mean to render <Context.Consumer> instead?");
            }
          }
        } else {
          context = context._context;
        }
      }
      var newProps = workInProgress.pendingProps;
      var render = newProps.children;
      {
        if (typeof render !== "function") {
          error("A context consumer was rendered with multiple children, or a child " + "that isn't a function. A context consumer expects a single child " + "that is a function. If you did pass a function, make sure there " + "is no trailing or leading whitespace around it.");
        }
      }
      prepareToReadContext(workInProgress, renderLanes);
      var newValue = _readContext(context);
      var newChildren;
      {
        ReactCurrentOwner$1.current = workInProgress;
        setIsRendering(true);
        newChildren = render(newValue);
        setIsRendering(false);
      }
      workInProgress.flags |= PerformedWork;
      reconcileChildren(current, workInProgress, newChildren, renderLanes);
      return workInProgress.child;
    }
    function markWorkInProgressReceivedUpdate() {
      didReceiveUpdate = true;
    }
    function resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress) {
      if ((workInProgress.mode & ConcurrentMode) === NoMode) {
        if (current !== null) {
          current.alternate = null;
          workInProgress.alternate = null;
          workInProgress.flags |= Placement;
        }
      }
    }
    function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
      if (current !== null) {
        workInProgress.dependencies = current.dependencies;
      }
      {
        stopProfilerTimerIfRunning();
      }
      markSkippedUpdateLanes(workInProgress.lanes);
      if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
        {
          return null;
        }
      }
      cloneChildFibers(current, workInProgress);
      return workInProgress.child;
    }
    function remountFiber(current, oldWorkInProgress, newWorkInProgress) {
      {
        var returnFiber = oldWorkInProgress.return;
        if (returnFiber === null) {
          throw new Error("Cannot swap the root fiber.");
        }
        current.alternate = null;
        oldWorkInProgress.alternate = null;
        newWorkInProgress.index = oldWorkInProgress.index;
        newWorkInProgress.sibling = oldWorkInProgress.sibling;
        newWorkInProgress.return = oldWorkInProgress.return;
        newWorkInProgress.ref = oldWorkInProgress.ref;
        if (oldWorkInProgress === returnFiber.child) {
          returnFiber.child = newWorkInProgress;
        } else {
          var prevSibling = returnFiber.child;
          if (prevSibling === null) {
            throw new Error("Expected parent to have a child.");
          }
          while (prevSibling.sibling !== oldWorkInProgress) {
            prevSibling = prevSibling.sibling;
            if (prevSibling === null) {
              throw new Error("Expected to find the previous sibling.");
            }
          }
          prevSibling.sibling = newWorkInProgress;
        }
        var deletions = returnFiber.deletions;
        if (deletions === null) {
          returnFiber.deletions = [current];
          returnFiber.flags |= ChildDeletion;
        } else {
          deletions.push(current);
        }
        newWorkInProgress.flags |= Placement;
        return newWorkInProgress;
      }
    }
    function checkScheduledUpdateOrContext(current, renderLanes) {
      var updateLanes = current.lanes;
      if (includesSomeLane(updateLanes, renderLanes)) {
        return true;
      }
      return false;
    }
    function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes) {
      switch (workInProgress.tag) {
        case HostRoot:
          pushHostRootContext(workInProgress);
          var root = workInProgress.stateNode;
          break;
        case HostComponent:
          pushHostContext(workInProgress);
          break;
        case ClassComponent:
          {
            var Component = workInProgress.type;
            if (isContextProvider(Component)) {
              pushContextProvider(workInProgress);
            }
            break;
          }
        case HostPortal:
          pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
          break;
        case ContextProvider:
          {
            var newValue = workInProgress.memoizedProps.value;
            var context = workInProgress.type._context;
            pushProvider(workInProgress, context, newValue);
            break;
          }
        case Profiler:
          {
            var hasChildWork = includesSomeLane(renderLanes, workInProgress.childLanes);
            if (hasChildWork) {
              workInProgress.flags |= Update;
            }
            {
              var stateNode = workInProgress.stateNode;
              stateNode.effectDuration = 0;
              stateNode.passiveEffectDuration = 0;
            }
          }
          break;
        case SuspenseComponent:
          {
            var state = workInProgress.memoizedState;
            if (state !== null) {
              if (state.dehydrated !== null) {
                pushSuspenseContext(workInProgress, setDefaultShallowSuspenseContext(suspenseStackCursor.current));
                workInProgress.flags |= DidCapture;
                return null;
              }
              var primaryChildFragment = workInProgress.child;
              var primaryChildLanes = primaryChildFragment.childLanes;
              if (includesSomeLane(renderLanes, primaryChildLanes)) {
                return updateSuspenseComponent(current, workInProgress, renderLanes);
              } else {
                pushSuspenseContext(workInProgress, setDefaultShallowSuspenseContext(suspenseStackCursor.current));
                var child = bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
                if (child !== null) {
                  return child.sibling;
                } else {
                  return null;
                }
              }
            } else {
              pushSuspenseContext(workInProgress, setDefaultShallowSuspenseContext(suspenseStackCursor.current));
            }
            break;
          }
        case SuspenseListComponent:
          {
            var didSuspendBefore = (current.flags & DidCapture) !== NoFlags;
            var _hasChildWork = includesSomeLane(renderLanes, workInProgress.childLanes);
            if (didSuspendBefore) {
              if (_hasChildWork) {
                return updateSuspenseListComponent(current, workInProgress, renderLanes);
              }
              workInProgress.flags |= DidCapture;
            }
            var renderState = workInProgress.memoizedState;
            if (renderState !== null) {
              renderState.rendering = null;
              renderState.tail = null;
              renderState.lastEffect = null;
            }
            pushSuspenseContext(workInProgress, suspenseStackCursor.current);
            if (_hasChildWork) {
              break;
            } else {
              return null;
            }
          }
        case OffscreenComponent:
        case LegacyHiddenComponent:
          {
            workInProgress.lanes = NoLanes;
            return updateOffscreenComponent(current, workInProgress, renderLanes);
          }
      }
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
    function beginWork(current, workInProgress, renderLanes) {
      {
        if (workInProgress._debugNeedsRemount && current !== null) {
          return remountFiber(current, workInProgress, createFiberFromTypeAndProps(workInProgress.type, workInProgress.key, workInProgress.pendingProps, workInProgress._debugOwner || null, workInProgress.mode, workInProgress.lanes));
        }
      }
      if (current !== null) {
        var oldProps = current.memoizedProps;
        var newProps = workInProgress.pendingProps;
        if (oldProps !== newProps || hasContextChanged() || workInProgress.type !== current.type) {
          didReceiveUpdate = true;
        } else {
          var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
          if (!hasScheduledUpdateOrContext && (workInProgress.flags & DidCapture) === NoFlags) {
            didReceiveUpdate = false;
            return attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes);
          }
          if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
            didReceiveUpdate = true;
          } else {
            didReceiveUpdate = false;
          }
        }
      } else {
        didReceiveUpdate = false;
      }
      workInProgress.lanes = NoLanes;
      switch (workInProgress.tag) {
        case IndeterminateComponent:
          {
            return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
          }
        case LazyComponent:
          {
            var elementType = workInProgress.elementType;
            return mountLazyComponent(current, workInProgress, elementType, renderLanes);
          }
        case FunctionComponent:
          {
            var Component = workInProgress.type;
            var unresolvedProps = workInProgress.pendingProps;
            var resolvedProps = workInProgress.elementType === Component ? unresolvedProps : resolveDefaultProps(Component, unresolvedProps);
            return updateFunctionComponent(current, workInProgress, Component, resolvedProps, renderLanes);
          }
        case ClassComponent:
          {
            var _Component = workInProgress.type;
            var _unresolvedProps = workInProgress.pendingProps;
            var _resolvedProps = workInProgress.elementType === _Component ? _unresolvedProps : resolveDefaultProps(_Component, _unresolvedProps);
            return updateClassComponent(current, workInProgress, _Component, _resolvedProps, renderLanes);
          }
        case HostRoot:
          return updateHostRoot(current, workInProgress, renderLanes);
        case HostComponent:
          return updateHostComponent(current, workInProgress, renderLanes);
        case HostText:
          return updateHostText();
        case SuspenseComponent:
          return updateSuspenseComponent(current, workInProgress, renderLanes);
        case HostPortal:
          return updatePortalComponent(current, workInProgress, renderLanes);
        case ForwardRef:
          {
            var type = workInProgress.type;
            var _unresolvedProps2 = workInProgress.pendingProps;
            var _resolvedProps2 = workInProgress.elementType === type ? _unresolvedProps2 : resolveDefaultProps(type, _unresolvedProps2);
            return updateForwardRef(current, workInProgress, type, _resolvedProps2, renderLanes);
          }
        case Fragment:
          return updateFragment(current, workInProgress, renderLanes);
        case Mode:
          return updateMode(current, workInProgress, renderLanes);
        case Profiler:
          return updateProfiler(current, workInProgress, renderLanes);
        case ContextProvider:
          return updateContextProvider(current, workInProgress, renderLanes);
        case ContextConsumer:
          return updateContextConsumer(current, workInProgress, renderLanes);
        case MemoComponent:
          {
            var _type2 = workInProgress.type;
            var _unresolvedProps3 = workInProgress.pendingProps;
            var _resolvedProps3 = resolveDefaultProps(_type2, _unresolvedProps3);
            {
              if (workInProgress.type !== workInProgress.elementType) {
                var outerPropTypes = _type2.propTypes;
                if (outerPropTypes) {
                  checkPropTypes(outerPropTypes, _resolvedProps3, "prop", getComponentNameFromType(_type2));
                }
              }
            }
            _resolvedProps3 = resolveDefaultProps(_type2.type, _resolvedProps3);
            return updateMemoComponent(current, workInProgress, _type2, _resolvedProps3, renderLanes);
          }
        case SimpleMemoComponent:
          {
            return updateSimpleMemoComponent(current, workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes);
          }
        case IncompleteClassComponent:
          {
            var _Component2 = workInProgress.type;
            var _unresolvedProps4 = workInProgress.pendingProps;
            var _resolvedProps4 = workInProgress.elementType === _Component2 ? _unresolvedProps4 : resolveDefaultProps(_Component2, _unresolvedProps4);
            return mountIncompleteClassComponent(current, workInProgress, _Component2, _resolvedProps4, renderLanes);
          }
        case SuspenseListComponent:
          {
            return updateSuspenseListComponent(current, workInProgress, renderLanes);
          }
        case ScopeComponent:
          {
            break;
          }
        case OffscreenComponent:
          {
            return updateOffscreenComponent(current, workInProgress, renderLanes);
          }
      }
      throw new Error("Unknown unit of work tag (" + workInProgress.tag + "). This error is likely caused by a bug in " + "React. Please file an issue.");
    }
    function markUpdate(workInProgress) {
      workInProgress.flags |= Update;
    }
    function markRef$1(workInProgress) {
      workInProgress.flags |= Ref;
    }
    var appendAllChildren;
    var updateHostContainer;
    var updateHostComponent$1;
    var updateHostText$1;
    {
      appendAllChildren = function appendAllChildren(parent, workInProgress, needsVisibilityToggle, isHidden) {
        var node = workInProgress.child;
        while (node !== null) {
          if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
          } else if (node.tag === HostPortal) ;else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }
          if (node === workInProgress) {
            return;
          }
          while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) {
              return;
            }
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      };
      updateHostContainer = function updateHostContainer(current, workInProgress) {};
      updateHostComponent$1 = function updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance) {
        var oldProps = current.memoizedProps;
        if (oldProps === newProps) {
          return;
        }
        var instance = workInProgress.stateNode;
        var currentHostContext = getHostContext();
        var updatePayload = prepareUpdate();
        workInProgress.updateQueue = updatePayload;
        if (updatePayload) {
          markUpdate(workInProgress);
        }
      };
      updateHostText$1 = function updateHostText$1(current, workInProgress, oldText, newText) {
        if (oldText !== newText) {
          markUpdate(workInProgress);
        }
      };
    }
    function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
      switch (renderState.tailMode) {
        case "hidden":
          {
            var tailNode = renderState.tail;
            var lastTailNode = null;
            while (tailNode !== null) {
              if (tailNode.alternate !== null) {
                lastTailNode = tailNode;
              }
              tailNode = tailNode.sibling;
            }
            if (lastTailNode === null) {
              renderState.tail = null;
            } else {
              lastTailNode.sibling = null;
            }
            break;
          }
        case "collapsed":
          {
            var _tailNode = renderState.tail;
            var _lastTailNode = null;
            while (_tailNode !== null) {
              if (_tailNode.alternate !== null) {
                _lastTailNode = _tailNode;
              }
              _tailNode = _tailNode.sibling;
            }
            if (_lastTailNode === null) {
              if (!hasRenderedATailFallback && renderState.tail !== null) {
                renderState.tail.sibling = null;
              } else {
                renderState.tail = null;
              }
            } else {
              _lastTailNode.sibling = null;
            }
            break;
          }
      }
    }
    function bubbleProperties(completedWork) {
      var didBailout = completedWork.alternate !== null && completedWork.alternate.child === completedWork.child;
      var newChildLanes = NoLanes;
      var subtreeFlags = NoFlags;
      if (!didBailout) {
        if ((completedWork.mode & ProfileMode) !== NoMode) {
          var actualDuration = completedWork.actualDuration;
          var treeBaseDuration = completedWork.selfBaseDuration;
          var child = completedWork.child;
          while (child !== null) {
            newChildLanes = mergeLanes(newChildLanes, mergeLanes(child.lanes, child.childLanes));
            subtreeFlags |= child.subtreeFlags;
            subtreeFlags |= child.flags;
            actualDuration += child.actualDuration;
            treeBaseDuration += child.treeBaseDuration;
            child = child.sibling;
          }
          completedWork.actualDuration = actualDuration;
          completedWork.treeBaseDuration = treeBaseDuration;
        } else {
          var _child = completedWork.child;
          while (_child !== null) {
            newChildLanes = mergeLanes(newChildLanes, mergeLanes(_child.lanes, _child.childLanes));
            subtreeFlags |= _child.subtreeFlags;
            subtreeFlags |= _child.flags;
            _child.return = completedWork;
            _child = _child.sibling;
          }
        }
        completedWork.subtreeFlags |= subtreeFlags;
      } else {
        if ((completedWork.mode & ProfileMode) !== NoMode) {
          var _treeBaseDuration = completedWork.selfBaseDuration;
          var _child2 = completedWork.child;
          while (_child2 !== null) {
            newChildLanes = mergeLanes(newChildLanes, mergeLanes(_child2.lanes, _child2.childLanes));
            subtreeFlags |= _child2.subtreeFlags & StaticMask;
            subtreeFlags |= _child2.flags & StaticMask;
            _treeBaseDuration += _child2.treeBaseDuration;
            _child2 = _child2.sibling;
          }
          completedWork.treeBaseDuration = _treeBaseDuration;
        } else {
          var _child3 = completedWork.child;
          while (_child3 !== null) {
            newChildLanes = mergeLanes(newChildLanes, mergeLanes(_child3.lanes, _child3.childLanes));
            subtreeFlags |= _child3.subtreeFlags & StaticMask;
            subtreeFlags |= _child3.flags & StaticMask;
            _child3.return = completedWork;
            _child3 = _child3.sibling;
          }
        }
        completedWork.subtreeFlags |= subtreeFlags;
      }
      completedWork.childLanes = newChildLanes;
      return didBailout;
    }
    function completeDehydratedSuspenseBoundary(current, workInProgress, nextState) {
      var wasHydrated = popHydrationState();
      if (nextState !== null && nextState.dehydrated !== null) {
        if (current === null) {
          if (!wasHydrated) {
            throw new Error("A dehydrated suspense component was completed without a hydrated node. " + "This is probably a bug in React.");
          }
          prepareToHydrateHostSuspenseInstance();
          bubbleProperties(workInProgress);
          {
            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              var isTimedOutSuspense = nextState !== null;
              if (isTimedOutSuspense) {
                var primaryChildFragment = workInProgress.child;
                if (primaryChildFragment !== null) {
                  workInProgress.treeBaseDuration -= primaryChildFragment.treeBaseDuration;
                }
              }
            }
          }
          return false;
        } else {
          if ((workInProgress.flags & DidCapture) === NoFlags) {
            workInProgress.memoizedState = null;
          }
          workInProgress.flags |= Update;
          bubbleProperties(workInProgress);
          {
            if ((workInProgress.mode & ProfileMode) !== NoMode) {
              var _isTimedOutSuspense = nextState !== null;
              if (_isTimedOutSuspense) {
                var _primaryChildFragment = workInProgress.child;
                if (_primaryChildFragment !== null) {
                  workInProgress.treeBaseDuration -= _primaryChildFragment.treeBaseDuration;
                }
              }
            }
          }
          return false;
        }
      } else {
        upgradeHydrationErrorsToRecoverable();
        return true;
      }
    }
    function completeWork(current, workInProgress, renderLanes) {
      var newProps = workInProgress.pendingProps;
      popTreeContext(workInProgress);
      switch (workInProgress.tag) {
        case IndeterminateComponent:
        case LazyComponent:
        case SimpleMemoComponent:
        case FunctionComponent:
        case ForwardRef:
        case Fragment:
        case Mode:
        case Profiler:
        case ContextConsumer:
        case MemoComponent:
          bubbleProperties(workInProgress);
          return null;
        case ClassComponent:
          {
            var Component = workInProgress.type;
            if (isContextProvider(Component)) {
              popContext(workInProgress);
            }
            bubbleProperties(workInProgress);
            return null;
          }
        case HostRoot:
          {
            var fiberRoot = workInProgress.stateNode;
            popHostContainer(workInProgress);
            popTopLevelContextObject(workInProgress);
            resetWorkInProgressVersions();
            if (fiberRoot.pendingContext) {
              fiberRoot.context = fiberRoot.pendingContext;
              fiberRoot.pendingContext = null;
            }
            if (current === null || current.child === null) {
              var wasHydrated = popHydrationState();
              if (wasHydrated) {
                markUpdate(workInProgress);
              } else {
                if (current !== null) {
                  var prevState = current.memoizedState;
                  if (!prevState.isDehydrated || (workInProgress.flags & ForceClientRender) !== NoFlags) {
                    workInProgress.flags |= Snapshot;
                    upgradeHydrationErrorsToRecoverable();
                  }
                }
              }
            }
            updateHostContainer(current, workInProgress);
            bubbleProperties(workInProgress);
            return null;
          }
        case HostComponent:
          {
            popHostContext(workInProgress);
            var rootContainerInstance = getRootHostContainer();
            var type = workInProgress.type;
            if (current !== null && workInProgress.stateNode != null) {
              updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);
              if (current.ref !== workInProgress.ref) {
                markRef$1(workInProgress);
              }
            } else {
              if (!newProps) {
                if (workInProgress.stateNode === null) {
                  throw new Error("We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue.");
                }
                bubbleProperties(workInProgress);
                return null;
              }
              var currentHostContext = getHostContext();
              var _wasHydrated = popHydrationState();
              if (_wasHydrated) {
                if (prepareToHydrateHostInstance()) {
                  markUpdate(workInProgress);
                }
              } else {
                var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
                appendAllChildren(instance, workInProgress, false, false);
                workInProgress.stateNode = instance;
                if (finalizeInitialChildren(instance)) {
                  markUpdate(workInProgress);
                }
              }
              if (workInProgress.ref !== null) {
                markRef$1(workInProgress);
              }
            }
            bubbleProperties(workInProgress);
            return null;
          }
        case HostText:
          {
            var newText = newProps;
            if (current && workInProgress.stateNode != null) {
              var oldText = current.memoizedProps;
              updateHostText$1(current, workInProgress, oldText, newText);
            } else {
              if (typeof newText !== "string") {
                if (workInProgress.stateNode === null) {
                  throw new Error("We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue.");
                }
              }
              var _rootContainerInstance = getRootHostContainer();
              var _currentHostContext = getHostContext();
              var _wasHydrated2 = popHydrationState();
              if (_wasHydrated2) {
                if (prepareToHydrateHostTextInstance()) {
                  markUpdate(workInProgress);
                }
              } else {
                workInProgress.stateNode = createTextInstance(newText, _rootContainerInstance, _currentHostContext, workInProgress);
              }
            }
            bubbleProperties(workInProgress);
            return null;
          }
        case SuspenseComponent:
          {
            popSuspenseContext(workInProgress);
            var nextState = workInProgress.memoizedState;
            if (current === null || current.memoizedState !== null && current.memoizedState.dehydrated !== null) {
              var fallthroughToNormalSuspensePath = completeDehydratedSuspenseBoundary(current, workInProgress, nextState);
              if (!fallthroughToNormalSuspensePath) {
                if (workInProgress.flags & ShouldCapture) {
                  return workInProgress;
                } else {
                  return null;
                }
              }
            }
            if ((workInProgress.flags & DidCapture) !== NoFlags) {
              workInProgress.lanes = renderLanes;
              if ((workInProgress.mode & ProfileMode) !== NoMode) {
                transferActualDuration(workInProgress);
              }
              return workInProgress;
            }
            var nextDidTimeout = nextState !== null;
            var prevDidTimeout = current !== null && current.memoizedState !== null;
            if (nextDidTimeout !== prevDidTimeout) {
              if (nextDidTimeout) {
                var _offscreenFiber2 = workInProgress.child;
                _offscreenFiber2.flags |= Visibility;
                if ((workInProgress.mode & ConcurrentMode) !== NoMode) {
                  var hasInvisibleChildContext = current === null && (workInProgress.memoizedProps.unstable_avoidThisFallback !== true || !enableSuspenseAvoidThisFallback);
                  if (hasInvisibleChildContext || hasSuspenseContext(suspenseStackCursor.current, InvisibleParentSuspenseContext)) {
                    renderDidSuspend();
                  } else {
                    renderDidSuspendDelayIfPossible();
                  }
                }
              }
            }
            var wakeables = workInProgress.updateQueue;
            if (wakeables !== null) {
              workInProgress.flags |= Update;
            }
            bubbleProperties(workInProgress);
            {
              if ((workInProgress.mode & ProfileMode) !== NoMode) {
                if (nextDidTimeout) {
                  var primaryChildFragment = workInProgress.child;
                  if (primaryChildFragment !== null) {
                    workInProgress.treeBaseDuration -= primaryChildFragment.treeBaseDuration;
                  }
                }
              }
            }
            return null;
          }
        case HostPortal:
          popHostContainer(workInProgress);
          updateHostContainer(current, workInProgress);
          if (current === null) {
            preparePortalMount(workInProgress.stateNode.containerInfo);
          }
          bubbleProperties(workInProgress);
          return null;
        case ContextProvider:
          var context = workInProgress.type._context;
          popProvider(context, workInProgress);
          bubbleProperties(workInProgress);
          return null;
        case IncompleteClassComponent:
          {
            var _Component = workInProgress.type;
            if (isContextProvider(_Component)) {
              popContext(workInProgress);
            }
            bubbleProperties(workInProgress);
            return null;
          }
        case SuspenseListComponent:
          {
            popSuspenseContext(workInProgress);
            var renderState = workInProgress.memoizedState;
            if (renderState === null) {
              bubbleProperties(workInProgress);
              return null;
            }
            var didSuspendAlready = (workInProgress.flags & DidCapture) !== NoFlags;
            var renderedTail = renderState.rendering;
            if (renderedTail === null) {
              if (!didSuspendAlready) {
                var cannotBeSuspended = renderHasNotSuspendedYet() && (current === null || (current.flags & DidCapture) === NoFlags);
                if (!cannotBeSuspended) {
                  var row = workInProgress.child;
                  while (row !== null) {
                    var suspended = findFirstSuspended(row);
                    if (suspended !== null) {
                      didSuspendAlready = true;
                      workInProgress.flags |= DidCapture;
                      cutOffTailIfNeeded(renderState, false);
                      var newThenables = suspended.updateQueue;
                      if (newThenables !== null) {
                        workInProgress.updateQueue = newThenables;
                        workInProgress.flags |= Update;
                      }
                      workInProgress.subtreeFlags = NoFlags;
                      resetChildFibers(workInProgress, renderLanes);
                      pushSuspenseContext(workInProgress, setShallowSuspenseContext(suspenseStackCursor.current, ForceSuspenseFallback));
                      return workInProgress.child;
                    }
                    row = row.sibling;
                  }
                }
                if (renderState.tail !== null && now() > getRenderTargetTime()) {
                  workInProgress.flags |= DidCapture;
                  didSuspendAlready = true;
                  cutOffTailIfNeeded(renderState, false);
                  workInProgress.lanes = SomeRetryLane;
                }
              } else {
                cutOffTailIfNeeded(renderState, false);
              }
            } else {
              if (!didSuspendAlready) {
                var _suspended = findFirstSuspended(renderedTail);
                if (_suspended !== null) {
                  workInProgress.flags |= DidCapture;
                  didSuspendAlready = true;
                  var _newThenables = _suspended.updateQueue;
                  if (_newThenables !== null) {
                    workInProgress.updateQueue = _newThenables;
                    workInProgress.flags |= Update;
                  }
                  cutOffTailIfNeeded(renderState, true);
                  if (renderState.tail === null && renderState.tailMode === "hidden" && !renderedTail.alternate && !getIsHydrating()) {
                    bubbleProperties(workInProgress);
                    return null;
                  }
                } else if (now() * 2 - renderState.renderingStartTime > getRenderTargetTime() && renderLanes !== OffscreenLane) {
                  workInProgress.flags |= DidCapture;
                  didSuspendAlready = true;
                  cutOffTailIfNeeded(renderState, false);
                  workInProgress.lanes = SomeRetryLane;
                }
              }
              if (renderState.isBackwards) {
                renderedTail.sibling = workInProgress.child;
                workInProgress.child = renderedTail;
              } else {
                var previousSibling = renderState.last;
                if (previousSibling !== null) {
                  previousSibling.sibling = renderedTail;
                } else {
                  workInProgress.child = renderedTail;
                }
                renderState.last = renderedTail;
              }
            }
            if (renderState.tail !== null) {
              var next = renderState.tail;
              renderState.rendering = next;
              renderState.tail = next.sibling;
              renderState.renderingStartTime = now();
              next.sibling = null;
              var suspenseContext = suspenseStackCursor.current;
              if (didSuspendAlready) {
                suspenseContext = setShallowSuspenseContext(suspenseContext, ForceSuspenseFallback);
              } else {
                suspenseContext = setDefaultShallowSuspenseContext(suspenseContext);
              }
              pushSuspenseContext(workInProgress, suspenseContext);
              return next;
            }
            bubbleProperties(workInProgress);
            return null;
          }
        case ScopeComponent:
          {
            break;
          }
        case OffscreenComponent:
        case LegacyHiddenComponent:
          {
            popRenderLanes(workInProgress);
            var _nextState = workInProgress.memoizedState;
            var nextIsHidden = _nextState !== null;
            if (current !== null) {
              var _prevState = current.memoizedState;
              var prevIsHidden = _prevState !== null;
              if (prevIsHidden !== nextIsHidden && !enableLegacyHidden) {
                workInProgress.flags |= Visibility;
              }
            }
            if (!nextIsHidden || (workInProgress.mode & ConcurrentMode) === NoMode) {
              bubbleProperties(workInProgress);
            } else {
              if (includesSomeLane(subtreeRenderLanes, OffscreenLane)) {
                bubbleProperties(workInProgress);
                {
                  if (workInProgress.subtreeFlags & (Placement | Update)) {
                    workInProgress.flags |= Visibility;
                  }
                }
              }
            }
            return null;
          }
        case CacheComponent:
          {
            return null;
          }
        case TracingMarkerComponent:
          {
            return null;
          }
      }
      throw new Error("Unknown unit of work tag (" + workInProgress.tag + "). This error is likely caused by a bug in " + "React. Please file an issue.");
    }
    function unwindWork(current, workInProgress, renderLanes) {
      popTreeContext(workInProgress);
      switch (workInProgress.tag) {
        case ClassComponent:
          {
            var Component = workInProgress.type;
            if (isContextProvider(Component)) {
              popContext(workInProgress);
            }
            var flags = workInProgress.flags;
            if (flags & ShouldCapture) {
              workInProgress.flags = flags & ~ShouldCapture | DidCapture;
              if ((workInProgress.mode & ProfileMode) !== NoMode) {
                transferActualDuration(workInProgress);
              }
              return workInProgress;
            }
            return null;
          }
        case HostRoot:
          {
            var root = workInProgress.stateNode;
            popHostContainer(workInProgress);
            popTopLevelContextObject(workInProgress);
            resetWorkInProgressVersions();
            var _flags = workInProgress.flags;
            if ((_flags & ShouldCapture) !== NoFlags && (_flags & DidCapture) === NoFlags) {
              workInProgress.flags = _flags & ~ShouldCapture | DidCapture;
              return workInProgress;
            }
            return null;
          }
        case HostComponent:
          {
            popHostContext(workInProgress);
            return null;
          }
        case SuspenseComponent:
          {
            popSuspenseContext(workInProgress);
            var suspenseState = workInProgress.memoizedState;
            if (suspenseState !== null && suspenseState.dehydrated !== null) {
              if (workInProgress.alternate === null) {
                throw new Error("Threw in newly mounted dehydrated component. This is likely a bug in " + "React. Please file an issue.");
              }
            }
            var _flags2 = workInProgress.flags;
            if (_flags2 & ShouldCapture) {
              workInProgress.flags = _flags2 & ~ShouldCapture | DidCapture;
              if ((workInProgress.mode & ProfileMode) !== NoMode) {
                transferActualDuration(workInProgress);
              }
              return workInProgress;
            }
            return null;
          }
        case SuspenseListComponent:
          {
            popSuspenseContext(workInProgress);
            return null;
          }
        case HostPortal:
          popHostContainer(workInProgress);
          return null;
        case ContextProvider:
          var context = workInProgress.type._context;
          popProvider(context, workInProgress);
          return null;
        case OffscreenComponent:
        case LegacyHiddenComponent:
          popRenderLanes(workInProgress);
          return null;
        case CacheComponent:
          return null;
        default:
          return null;
      }
    }
    function unwindInterruptedWork(current, interruptedWork, renderLanes) {
      popTreeContext(interruptedWork);
      switch (interruptedWork.tag) {
        case ClassComponent:
          {
            var childContextTypes = interruptedWork.type.childContextTypes;
            if (childContextTypes !== null && childContextTypes !== undefined) {
              popContext(interruptedWork);
            }
            break;
          }
        case HostRoot:
          {
            var root = interruptedWork.stateNode;
            popHostContainer(interruptedWork);
            popTopLevelContextObject(interruptedWork);
            resetWorkInProgressVersions();
            break;
          }
        case HostComponent:
          {
            popHostContext(interruptedWork);
            break;
          }
        case HostPortal:
          popHostContainer(interruptedWork);
          break;
        case SuspenseComponent:
          popSuspenseContext(interruptedWork);
          break;
        case SuspenseListComponent:
          popSuspenseContext(interruptedWork);
          break;
        case ContextProvider:
          var context = interruptedWork.type._context;
          popProvider(context, interruptedWork);
          break;
        case OffscreenComponent:
        case LegacyHiddenComponent:
          popRenderLanes(interruptedWork);
          break;
      }
    }
    var didWarnAboutUndefinedSnapshotBeforeUpdate = null;
    {
      didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
    }
    var PossiblyWeakSet = typeof WeakSet === "function" ? WeakSet : Set;
    var nextEffect = null;
    var inProgressLanes = null;
    var inProgressRoot = null;
    function reportUncaughtErrorInDEV(error) {
      {
        invokeGuardedCallback(null, function () {
          throw error;
        });
        clearCaughtError();
      }
    }
    var callComponentWillUnmountWithTimer = function callComponentWillUnmountWithTimer(current, instance) {
      instance.props = current.memoizedProps;
      instance.state = current.memoizedState;
      if (current.mode & ProfileMode) {
        try {
          startLayoutEffectTimer();
          instance.componentWillUnmount();
        } finally {
          recordLayoutEffectDuration(current);
        }
      } else {
        instance.componentWillUnmount();
      }
    };
    function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
      try {
        callComponentWillUnmountWithTimer(current, instance);
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
    function safelyDetachRef(current, nearestMountedAncestor) {
      var ref = current.ref;
      if (ref !== null) {
        if (typeof ref === "function") {
          var retVal;
          try {
            if (enableProfilerTimer && enableProfilerCommitHooks && current.mode & ProfileMode) {
              try {
                startLayoutEffectTimer();
                retVal = ref(null);
              } finally {
                recordLayoutEffectDuration(current);
              }
            } else {
              retVal = ref(null);
            }
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          }
          {
            if (typeof retVal === "function") {
              error("Unexpected return value from a callback ref in %s. " + "A callback ref should not return a function.", getComponentNameFromFiber(current));
            }
          }
        } else {
          ref.current = null;
        }
      }
    }
    function safelyCallDestroy(current, nearestMountedAncestor, destroy) {
      try {
        destroy();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
    var focusedInstanceHandle = null;
    var shouldFireAfterActiveInstanceBlur = false;
    function commitBeforeMutationEffects(root, firstChild) {
      focusedInstanceHandle = prepareForCommit(root.containerInfo);
      nextEffect = firstChild;
      commitBeforeMutationEffects_begin();
      var shouldFire = shouldFireAfterActiveInstanceBlur;
      shouldFireAfterActiveInstanceBlur = false;
      focusedInstanceHandle = null;
      return shouldFire;
    }
    function commitBeforeMutationEffects_begin() {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        var child = fiber.child;
        if ((fiber.subtreeFlags & BeforeMutationMask) !== NoFlags && child !== null) {
          child.return = fiber;
          nextEffect = child;
        } else {
          commitBeforeMutationEffects_complete();
        }
      }
    }
    function commitBeforeMutationEffects_complete() {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        setCurrentFiber(fiber);
        try {
          commitBeforeMutationEffectsOnFiber(fiber);
        } catch (error) {
          captureCommitPhaseError(fiber, fiber.return, error);
        }
        resetCurrentFiber();
        var sibling = fiber.sibling;
        if (sibling !== null) {
          sibling.return = fiber.return;
          nextEffect = sibling;
          return;
        }
        nextEffect = fiber.return;
      }
    }
    function commitBeforeMutationEffectsOnFiber(finishedWork) {
      var current = finishedWork.alternate;
      var flags = finishedWork.flags;
      if ((flags & Snapshot) !== NoFlags) {
        setCurrentFiber(finishedWork);
        switch (finishedWork.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent:
            {
              break;
            }
          case ClassComponent:
            {
              if (current !== null) {
                var prevProps = current.memoizedProps;
                var prevState = current.memoizedState;
                var instance = finishedWork.stateNode;
                {
                  if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                    if (instance.props !== finishedWork.memoizedProps) {
                      error("Expected %s props to match memoized props before " + "getSnapshotBeforeUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                    }
                    if (instance.state !== finishedWork.memoizedState) {
                      error("Expected %s state to match memoized state before " + "getSnapshotBeforeUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                    }
                  }
                }
                var snapshot = instance.getSnapshotBeforeUpdate(finishedWork.elementType === finishedWork.type ? prevProps : resolveDefaultProps(finishedWork.type, prevProps), prevState);
                {
                  var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;
                  if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
                    didWarnSet.add(finishedWork.type);
                    error("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) " + "must be returned. You have returned undefined.", getComponentNameFromFiber(finishedWork));
                  }
                }
                instance.__reactInternalSnapshotBeforeUpdate = snapshot;
              }
              break;
            }
          case HostRoot:
            {
              {
                var root = finishedWork.stateNode;
                clearContainer(root.containerInfo);
              }
              break;
            }
          case HostComponent:
          case HostText:
          case HostPortal:
          case IncompleteClassComponent:
            break;
          default:
            {
              throw new Error("This unit of work tag should not have side-effects. This error is " + "likely caused by a bug in React. Please file an issue.");
            }
        }
        resetCurrentFiber();
      }
    }
    function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor) {
      var updateQueue = finishedWork.updateQueue;
      var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
      if (lastEffect !== null) {
        var firstEffect = lastEffect.next;
        var effect = firstEffect;
        do {
          if ((effect.tag & flags) === flags) {
            var destroy = effect.destroy;
            effect.destroy = undefined;
            if (destroy !== undefined) {
              {
                if ((flags & Insertion) !== NoFlags$1) {
                  setIsRunningInsertionEffect(true);
                }
              }
              safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
              {
                if ((flags & Insertion) !== NoFlags$1) {
                  setIsRunningInsertionEffect(false);
                }
              }
            }
          }
          effect = effect.next;
        } while (effect !== firstEffect);
      }
    }
    function commitHookEffectListMount(flags, finishedWork) {
      var updateQueue = finishedWork.updateQueue;
      var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
      if (lastEffect !== null) {
        var firstEffect = lastEffect.next;
        var effect = firstEffect;
        do {
          if ((effect.tag & flags) === flags) {
            var create = effect.create;
            {
              if ((flags & Insertion) !== NoFlags$1) {
                setIsRunningInsertionEffect(true);
              }
            }
            effect.destroy = create();
            {
              if ((flags & Insertion) !== NoFlags$1) {
                setIsRunningInsertionEffect(false);
              }
            }
            {
              var destroy = effect.destroy;
              if (destroy !== undefined && typeof destroy !== "function") {
                var hookName = void 0;
                if ((effect.tag & Layout) !== NoFlags) {
                  hookName = "useLayoutEffect";
                } else if ((effect.tag & Insertion) !== NoFlags) {
                  hookName = "useInsertionEffect";
                } else {
                  hookName = "useEffect";
                }
                var addendum = void 0;
                if (destroy === null) {
                  addendum = " You returned null. If your effect does not require clean " + "up, return undefined (or nothing).";
                } else if (typeof destroy.then === "function") {
                  addendum = "\n\nIt looks like you wrote " + hookName + "(async () => ...) or returned a Promise. " + "Instead, write the async function inside your effect " + "and call it immediately:\n\n" + hookName + "(() => {\n" + "  async function fetchData() {\n" + "    // You can await here\n" + "    const response = await MyAPI.getData(someId);\n" + "    // ...\n" + "  }\n" + "  fetchData();\n" + "}, [someId]); // Or [] if effect doesn't need props or state\n\n" + "Learn more about data fetching with Hooks: https://reactjs.org/link/hooks-data-fetching";
                } else {
                  addendum = " You returned: " + destroy;
                }
                error("%s must not return anything besides a function, " + "which is used for clean-up.%s", hookName, addendum);
              }
            }
          }
          effect = effect.next;
        } while (effect !== firstEffect);
      }
    }
    function commitPassiveEffectDurations(finishedRoot, finishedWork) {
      {
        if ((finishedWork.flags & Update) !== NoFlags) {
          switch (finishedWork.tag) {
            case Profiler:
              {
                var passiveEffectDuration = finishedWork.stateNode.passiveEffectDuration;
                var _finishedWork$memoize = finishedWork.memoizedProps,
                  id = _finishedWork$memoize.id,
                  onPostCommit = _finishedWork$memoize.onPostCommit;
                var commitTime = getCommitTime();
                var phase = finishedWork.alternate === null ? "mount" : "update";
                {
                  if (isCurrentUpdateNested()) {
                    phase = "nested-update";
                  }
                }
                if (typeof onPostCommit === "function") {
                  onPostCommit(id, phase, passiveEffectDuration, commitTime);
                }
                var parentFiber = finishedWork.return;
                outer: while (parentFiber !== null) {
                  switch (parentFiber.tag) {
                    case HostRoot:
                      var root = parentFiber.stateNode;
                      root.passiveEffectDuration += passiveEffectDuration;
                      break outer;
                    case Profiler:
                      var parentStateNode = parentFiber.stateNode;
                      parentStateNode.passiveEffectDuration += passiveEffectDuration;
                      break outer;
                  }
                  parentFiber = parentFiber.return;
                }
                break;
              }
          }
        }
      }
    }
    function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork, committedLanes) {
      if ((finishedWork.flags & LayoutMask) !== NoFlags) {
        switch (finishedWork.tag) {
          case FunctionComponent:
          case ForwardRef:
          case SimpleMemoComponent:
            {
              {
                if (finishedWork.mode & ProfileMode) {
                  try {
                    startLayoutEffectTimer();
                    commitHookEffectListMount(Layout | HasEffect, finishedWork);
                  } finally {
                    recordLayoutEffectDuration(finishedWork);
                  }
                } else {
                  commitHookEffectListMount(Layout | HasEffect, finishedWork);
                }
              }
              break;
            }
          case ClassComponent:
            {
              var instance = finishedWork.stateNode;
              if (finishedWork.flags & Update) {
                {
                  if (current === null) {
                    {
                      if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                        if (instance.props !== finishedWork.memoizedProps) {
                          error("Expected %s props to match memoized props before " + "componentDidMount. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                        }
                        if (instance.state !== finishedWork.memoizedState) {
                          error("Expected %s state to match memoized state before " + "componentDidMount. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                        }
                      }
                    }
                    if (finishedWork.mode & ProfileMode) {
                      try {
                        startLayoutEffectTimer();
                        instance.componentDidMount();
                      } finally {
                        recordLayoutEffectDuration(finishedWork);
                      }
                    } else {
                      instance.componentDidMount();
                    }
                  } else {
                    var prevProps = finishedWork.elementType === finishedWork.type ? current.memoizedProps : resolveDefaultProps(finishedWork.type, current.memoizedProps);
                    var prevState = current.memoizedState;
                    {
                      if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                        if (instance.props !== finishedWork.memoizedProps) {
                          error("Expected %s props to match memoized props before " + "componentDidUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                        }
                        if (instance.state !== finishedWork.memoizedState) {
                          error("Expected %s state to match memoized state before " + "componentDidUpdate. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                        }
                      }
                    }
                    if (finishedWork.mode & ProfileMode) {
                      try {
                        startLayoutEffectTimer();
                        instance.componentDidUpdate(prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate);
                      } finally {
                        recordLayoutEffectDuration(finishedWork);
                      }
                    } else {
                      instance.componentDidUpdate(prevProps, prevState, instance.__reactInternalSnapshotBeforeUpdate);
                    }
                  }
                }
              }
              var updateQueue = finishedWork.updateQueue;
              if (updateQueue !== null) {
                {
                  if (finishedWork.type === finishedWork.elementType && !didWarnAboutReassigningProps) {
                    if (instance.props !== finishedWork.memoizedProps) {
                      error("Expected %s props to match memoized props before " + "processing the update queue. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.props`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                    }
                    if (instance.state !== finishedWork.memoizedState) {
                      error("Expected %s state to match memoized state before " + "processing the update queue. " + "This might either be because of a bug in React, or because " + "a component reassigns its own `this.state`. " + "Please file an issue.", getComponentNameFromFiber(finishedWork) || "instance");
                    }
                  }
                }
                commitUpdateQueue(finishedWork, updateQueue, instance);
              }
              break;
            }
          case HostRoot:
            {
              var _updateQueue = finishedWork.updateQueue;
              if (_updateQueue !== null) {
                var _instance = null;
                if (finishedWork.child !== null) {
                  switch (finishedWork.child.tag) {
                    case HostComponent:
                      _instance = getPublicInstance(finishedWork.child.stateNode);
                      break;
                    case ClassComponent:
                      _instance = finishedWork.child.stateNode;
                      break;
                  }
                }
                commitUpdateQueue(finishedWork, _updateQueue, _instance);
              }
              break;
            }
          case HostComponent:
            {
              var _instance2 = finishedWork.stateNode;
              if (current === null && finishedWork.flags & Update) {
                var type = finishedWork.type;
                var props = finishedWork.memoizedProps;
              }
              break;
            }
          case HostText:
            {
              break;
            }
          case HostPortal:
            {
              break;
            }
          case Profiler:
            {
              {
                var _finishedWork$memoize2 = finishedWork.memoizedProps,
                  onCommit = _finishedWork$memoize2.onCommit,
                  onRender = _finishedWork$memoize2.onRender;
                var effectDuration = finishedWork.stateNode.effectDuration;
                var commitTime = getCommitTime();
                var phase = current === null ? "mount" : "update";
                {
                  if (isCurrentUpdateNested()) {
                    phase = "nested-update";
                  }
                }
                if (typeof onRender === "function") {
                  onRender(finishedWork.memoizedProps.id, phase, finishedWork.actualDuration, finishedWork.treeBaseDuration, finishedWork.actualStartTime, commitTime);
                }
                {
                  if (typeof onCommit === "function") {
                    onCommit(finishedWork.memoizedProps.id, phase, effectDuration, commitTime);
                  }
                  enqueuePendingPassiveProfilerEffect(finishedWork);
                  var parentFiber = finishedWork.return;
                  outer: while (parentFiber !== null) {
                    switch (parentFiber.tag) {
                      case HostRoot:
                        var root = parentFiber.stateNode;
                        root.effectDuration += effectDuration;
                        break outer;
                      case Profiler:
                        var parentStateNode = parentFiber.stateNode;
                        parentStateNode.effectDuration += effectDuration;
                        break outer;
                    }
                    parentFiber = parentFiber.return;
                  }
                }
              }
              break;
            }
          case SuspenseComponent:
            {
              break;
            }
          case SuspenseListComponent:
          case IncompleteClassComponent:
          case ScopeComponent:
          case OffscreenComponent:
          case LegacyHiddenComponent:
          case TracingMarkerComponent:
            {
              break;
            }
          default:
            throw new Error("This unit of work tag should not have side-effects. This error is " + "likely caused by a bug in React. Please file an issue.");
        }
      }
      {
        {
          if (finishedWork.flags & Ref) {
            commitAttachRef(finishedWork);
          }
        }
      }
    }
    function hideOrUnhideAllChildren(finishedWork, isHidden) {
      var hostSubtreeRoot = null;
      {
        var node = finishedWork;
        while (true) {
          if (node.tag === HostComponent) {
            if (hostSubtreeRoot === null) {
              hostSubtreeRoot = node;
              try {
                var instance = node.stateNode;
                if (isHidden) {
                  hideInstance(instance);
                } else {
                  unhideInstance(node.stateNode, node.memoizedProps);
                }
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
          } else if (node.tag === HostText) {
            if (hostSubtreeRoot === null) {
              try {
                var _instance3 = node.stateNode;
                if (isHidden) {
                  hideTextInstance(_instance3);
                } else {
                  unhideTextInstance(_instance3, node.memoizedProps);
                }
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
          } else if ((node.tag === OffscreenComponent || node.tag === LegacyHiddenComponent) && node.memoizedState !== null && node !== finishedWork) ;else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }
          if (node === finishedWork) {
            return;
          }
          while (node.sibling === null) {
            if (node.return === null || node.return === finishedWork) {
              return;
            }
            if (hostSubtreeRoot === node) {
              hostSubtreeRoot = null;
            }
            node = node.return;
          }
          if (hostSubtreeRoot === node) {
            hostSubtreeRoot = null;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      }
    }
    function commitAttachRef(finishedWork) {
      var ref = finishedWork.ref;
      if (ref !== null) {
        var instance = finishedWork.stateNode;
        var instanceToUse;
        switch (finishedWork.tag) {
          case HostComponent:
            instanceToUse = getPublicInstance(instance);
            break;
          default:
            instanceToUse = instance;
        }
        if (typeof ref === "function") {
          var retVal;
          if (finishedWork.mode & ProfileMode) {
            try {
              startLayoutEffectTimer();
              retVal = ref(instanceToUse);
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            retVal = ref(instanceToUse);
          }
          {
            if (typeof retVal === "function") {
              error("Unexpected return value from a callback ref in %s. " + "A callback ref should not return a function.", getComponentNameFromFiber(finishedWork));
            }
          }
        } else {
          {
            if (!ref.hasOwnProperty("current")) {
              error("Unexpected ref object provided for %s. " + "Use either a ref-setter function or React.createRef().", getComponentNameFromFiber(finishedWork));
            }
          }
          ref.current = instanceToUse;
        }
      }
    }
    function detachFiberMutation(fiber) {
      var alternate = fiber.alternate;
      if (alternate !== null) {
        alternate.return = null;
      }
      fiber.return = null;
    }
    function detachFiberAfterEffects(fiber) {
      var alternate = fiber.alternate;
      if (alternate !== null) {
        fiber.alternate = null;
        detachFiberAfterEffects(alternate);
      }
      {
        fiber.child = null;
        fiber.deletions = null;
        fiber.sibling = null;
        if (fiber.tag === HostComponent) {
          var hostInstance = fiber.stateNode;
        }
        fiber.stateNode = null;
        {
          fiber._debugOwner = null;
        }
        {
          fiber.return = null;
          fiber.dependencies = null;
          fiber.memoizedProps = null;
          fiber.memoizedState = null;
          fiber.pendingProps = null;
          fiber.stateNode = null;
          fiber.updateQueue = null;
        }
      }
    }
    function getHostParentFiber(fiber) {
      var parent = fiber.return;
      while (parent !== null) {
        if (isHostParent(parent)) {
          return parent;
        }
        parent = parent.return;
      }
      throw new Error("Expected to find a host parent. This error is likely caused by a bug " + "in React. Please file an issue.");
    }
    function isHostParent(fiber) {
      return fiber.tag === HostComponent || fiber.tag === HostRoot || fiber.tag === HostPortal;
    }
    function getHostSibling(fiber) {
      var node = fiber;
      siblings: while (true) {
        while (node.sibling === null) {
          if (node.return === null || isHostParent(node.return)) {
            return null;
          }
          node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
        while (node.tag !== HostComponent && node.tag !== HostText && node.tag !== DehydratedFragment) {
          if (node.flags & Placement) {
            continue siblings;
          }
          if (node.child === null || node.tag === HostPortal) {
            continue siblings;
          } else {
            node.child.return = node;
            node = node.child;
          }
        }
        if (!(node.flags & Placement)) {
          return node.stateNode;
        }
      }
    }
    function commitPlacement(finishedWork) {
      var parentFiber = getHostParentFiber(finishedWork);
      switch (parentFiber.tag) {
        case HostComponent:
          {
            var parent = parentFiber.stateNode;
            if (parentFiber.flags & ContentReset) {
              parentFiber.flags &= ~ContentReset;
            }
            var before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
          }
        case HostRoot:
        case HostPortal:
          {
            var _parent = parentFiber.stateNode.containerInfo;
            var _before = getHostSibling(finishedWork);
            insertOrAppendPlacementNodeIntoContainer(finishedWork, _before, _parent);
            break;
          }
        default:
          throw new Error("Invalid host parent fiber. This error is likely caused by a bug " + "in React. Please file an issue.");
      }
    }
    function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
      var tag = node.tag;
      var isHost = tag === HostComponent || tag === HostText;
      if (isHost) {
        var stateNode = node.stateNode;
        if (before) {
          insertInContainerBefore(parent);
        } else {
          appendChildToContainer(parent, stateNode);
        }
      } else if (tag === HostPortal) ;else {
        var child = node.child;
        if (child !== null) {
          insertOrAppendPlacementNodeIntoContainer(child, before, parent);
          var sibling = child.sibling;
          while (sibling !== null) {
            insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
            sibling = sibling.sibling;
          }
        }
      }
    }
    function insertOrAppendPlacementNode(node, before, parent) {
      var tag = node.tag;
      var isHost = tag === HostComponent || tag === HostText;
      if (isHost) {
        var stateNode = node.stateNode;
        if (before) {
          insertBefore(parent, stateNode, before);
        } else {
          appendChild(parent, stateNode);
        }
      } else if (tag === HostPortal) ;else {
        var child = node.child;
        if (child !== null) {
          insertOrAppendPlacementNode(child, before, parent);
          var sibling = child.sibling;
          while (sibling !== null) {
            insertOrAppendPlacementNode(sibling, before, parent);
            sibling = sibling.sibling;
          }
        }
      }
    }
    var hostParent = null;
    var hostParentIsContainer = false;
    function commitDeletionEffects(root, returnFiber, deletedFiber) {
      {
        var parent = returnFiber;
        findParent: while (parent !== null) {
          switch (parent.tag) {
            case HostComponent:
              {
                hostParent = parent.stateNode;
                hostParentIsContainer = false;
                break findParent;
              }
            case HostRoot:
              {
                hostParent = parent.stateNode.containerInfo;
                hostParentIsContainer = true;
                break findParent;
              }
            case HostPortal:
              {
                hostParent = parent.stateNode.containerInfo;
                hostParentIsContainer = true;
                break findParent;
              }
          }
          parent = parent.return;
        }
        if (hostParent === null) {
          throw new Error("Expected to find a host parent. This error is likely caused by " + "a bug in React. Please file an issue.");
        }
        commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
        hostParent = null;
        hostParentIsContainer = false;
      }
      detachFiberMutation(deletedFiber);
    }
    function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
      var child = parent.child;
      while (child !== null) {
        commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
        child = child.sibling;
      }
    }
    function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
      onCommitUnmount(deletedFiber);
      switch (deletedFiber.tag) {
        case HostComponent:
          {
            {
              safelyDetachRef(deletedFiber, nearestMountedAncestor);
            }
          }
        case HostText:
          {
            {
              var prevHostParent = hostParent;
              var prevHostParentIsContainer = hostParentIsContainer;
              hostParent = null;
              recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
              hostParent = prevHostParent;
              hostParentIsContainer = prevHostParentIsContainer;
              if (hostParent !== null) {
                if (hostParentIsContainer) {
                  removeChildFromContainer(hostParent, deletedFiber.stateNode);
                } else {
                  removeChild(hostParent, deletedFiber.stateNode);
                }
              }
            }
            return;
          }
        case DehydratedFragment:
          {
            {
              if (hostParent !== null) {
                if (hostParentIsContainer) {
                  clearSuspenseBoundaryFromContainer(hostParent, deletedFiber.stateNode);
                } else {
                  clearSuspenseBoundary(hostParent, deletedFiber.stateNode);
                }
              }
            }
            return;
          }
        case HostPortal:
          {
            {
              var _prevHostParent = hostParent;
              var _prevHostParentIsContainer = hostParentIsContainer;
              hostParent = deletedFiber.stateNode.containerInfo;
              hostParentIsContainer = true;
              recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
              hostParent = _prevHostParent;
              hostParentIsContainer = _prevHostParentIsContainer;
            }
            return;
          }
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent:
          {
            {
              var updateQueue = deletedFiber.updateQueue;
              if (updateQueue !== null) {
                var lastEffect = updateQueue.lastEffect;
                if (lastEffect !== null) {
                  var firstEffect = lastEffect.next;
                  var effect = firstEffect;
                  do {
                    var _effect = effect,
                      destroy = _effect.destroy,
                      tag = _effect.tag;
                    if (destroy !== undefined) {
                      if ((tag & Insertion) !== NoFlags$1) {
                        safelyCallDestroy(deletedFiber, nearestMountedAncestor, destroy);
                      } else if ((tag & Layout) !== NoFlags$1) {
                        if (deletedFiber.mode & ProfileMode) {
                          startLayoutEffectTimer();
                          safelyCallDestroy(deletedFiber, nearestMountedAncestor, destroy);
                          recordLayoutEffectDuration(deletedFiber);
                        } else {
                          safelyCallDestroy(deletedFiber, nearestMountedAncestor, destroy);
                        }
                      }
                    }
                    effect = effect.next;
                  } while (effect !== firstEffect);
                }
              }
            }
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
          }
        case ClassComponent:
          {
            {
              safelyDetachRef(deletedFiber, nearestMountedAncestor);
              var instance = deletedFiber.stateNode;
              if (typeof instance.componentWillUnmount === "function") {
                safelyCallComponentWillUnmount(deletedFiber, nearestMountedAncestor, instance);
              }
            }
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
          }
        case ScopeComponent:
          {
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
          }
        case OffscreenComponent:
          {
            {
              recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            }
            break;
          }
        default:
          {
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            return;
          }
      }
    }
    function commitSuspenseCallback(finishedWork) {
      var newState = finishedWork.memoizedState;
    }
    function attachSuspenseRetryListeners(finishedWork) {
      var wakeables = finishedWork.updateQueue;
      if (wakeables !== null) {
        finishedWork.updateQueue = null;
        var retryCache = finishedWork.stateNode;
        if (retryCache === null) {
          retryCache = finishedWork.stateNode = new PossiblyWeakSet();
        }
        wakeables.forEach(function (wakeable) {
          var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
          if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            {
              if (isDevToolsPresent) {
                if (inProgressLanes !== null && inProgressRoot !== null) {
                  restorePendingUpdaters(inProgressRoot, inProgressLanes);
                } else {
                  throw Error("Expected finished root and lanes to be set. This is a bug in React.");
                }
              }
            }
            wakeable.then(retry, retry);
          }
        });
      }
    }
    function commitMutationEffects(root, finishedWork, committedLanes) {
      inProgressLanes = committedLanes;
      inProgressRoot = root;
      setCurrentFiber(finishedWork);
      commitMutationEffectsOnFiber(finishedWork, root);
      setCurrentFiber(finishedWork);
      inProgressLanes = null;
      inProgressRoot = null;
    }
    function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
      var deletions = parentFiber.deletions;
      if (deletions !== null) {
        for (var i = 0; i < deletions.length; i++) {
          var childToDelete = deletions[i];
          try {
            commitDeletionEffects(root, parentFiber, childToDelete);
          } catch (error) {
            captureCommitPhaseError(childToDelete, parentFiber, error);
          }
        }
      }
      var prevDebugFiber = getCurrentFiber();
      if (parentFiber.subtreeFlags & MutationMask) {
        var child = parentFiber.child;
        while (child !== null) {
          setCurrentFiber(child);
          commitMutationEffectsOnFiber(child, root);
          child = child.sibling;
        }
      }
      setCurrentFiber(prevDebugFiber);
    }
    function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
      var current = finishedWork.alternate;
      var flags = finishedWork.flags;
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
              try {
                commitHookEffectListUnmount(Insertion | HasEffect, finishedWork, finishedWork.return);
                commitHookEffectListMount(Insertion | HasEffect, finishedWork);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
              if (finishedWork.mode & ProfileMode) {
                try {
                  startLayoutEffectTimer();
                  commitHookEffectListUnmount(Layout | HasEffect, finishedWork, finishedWork.return);
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
                recordLayoutEffectDuration(finishedWork);
              } else {
                try {
                  commitHookEffectListUnmount(Layout | HasEffect, finishedWork, finishedWork.return);
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              }
            }
            return;
          }
        case ClassComponent:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Ref) {
              if (current !== null) {
                safelyDetachRef(current, current.return);
              }
            }
            return;
          }
        case HostComponent:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Ref) {
              if (current !== null) {
                safelyDetachRef(current, current.return);
              }
            }
            {
              if (finishedWork.flags & ContentReset) {
                var instance = finishedWork.stateNode;
                try {
                  resetTextContent(instance);
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              }
              if (flags & Update) {
                var _instance4 = finishedWork.stateNode;
                if (_instance4 != null) {
                  var newProps = finishedWork.memoizedProps;
                  var oldProps = current !== null ? current.memoizedProps : newProps;
                  var type = finishedWork.type;
                  var updatePayload = finishedWork.updateQueue;
                  finishedWork.updateQueue = null;
                  if (updatePayload !== null) {
                    try {
                      commitUpdate(_instance4, updatePayload, type, oldProps, newProps, finishedWork);
                    } catch (error) {
                      captureCommitPhaseError(finishedWork, finishedWork.return, error);
                    }
                  }
                }
              }
            }
            return;
          }
        case HostText:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
              {
                if (finishedWork.stateNode === null) {
                  throw new Error("This should have a text node initialized. This error is likely " + "caused by a bug in React. Please file an issue.");
                }
                var textInstance = finishedWork.stateNode;
                var newText = finishedWork.memoizedProps;
                var oldText = current !== null ? current.memoizedProps : newText;
                try {
                  commitTextUpdate(textInstance, oldText, newText);
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              }
            }
            return;
          }
        case HostRoot:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            return;
          }
        case HostPortal:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            return;
          }
        case SuspenseComponent:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            var offscreenFiber = finishedWork.child;
            if (offscreenFiber.flags & Visibility) {
              var offscreenInstance = offscreenFiber.stateNode;
              var newState = offscreenFiber.memoizedState;
              var isHidden = newState !== null;
              offscreenInstance.isHidden = isHidden;
              if (isHidden) {
                var wasHidden = offscreenFiber.alternate !== null && offscreenFiber.alternate.memoizedState !== null;
                if (!wasHidden) {
                  markCommitTimeOfFallback();
                }
              }
            }
            if (flags & Update) {
              try {
                commitSuspenseCallback(finishedWork);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
              attachSuspenseRetryListeners(finishedWork);
            }
            return;
          }
        case OffscreenComponent:
          {
            var _wasHidden = current !== null && current.memoizedState !== null;
            {
              recursivelyTraverseMutationEffects(root, finishedWork);
            }
            commitReconciliationEffects(finishedWork);
            if (flags & Visibility) {
              var _offscreenInstance = finishedWork.stateNode;
              var _newState = finishedWork.memoizedState;
              var _isHidden = _newState !== null;
              var offscreenBoundary = finishedWork;
              _offscreenInstance.isHidden = _isHidden;
              {
                hideOrUnhideAllChildren(offscreenBoundary, _isHidden);
              }
            }
            return;
          }
        case SuspenseListComponent:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
              attachSuspenseRetryListeners(finishedWork);
            }
            return;
          }
        case ScopeComponent:
          {
            return;
          }
        default:
          {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            return;
          }
      }
    }
    function commitReconciliationEffects(finishedWork) {
      var flags = finishedWork.flags;
      if (flags & Placement) {
        try {
          commitPlacement(finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        finishedWork.flags &= ~Placement;
      }
      if (flags & Hydrating) {
        finishedWork.flags &= ~Hydrating;
      }
    }
    function commitLayoutEffects(finishedWork, root, committedLanes) {
      inProgressLanes = committedLanes;
      inProgressRoot = root;
      nextEffect = finishedWork;
      commitLayoutEffects_begin(finishedWork, root, committedLanes);
      inProgressLanes = null;
      inProgressRoot = null;
    }
    function commitLayoutEffects_begin(subtreeRoot, root, committedLanes) {
      var isModernRoot = (subtreeRoot.mode & ConcurrentMode) !== NoMode;
      while (nextEffect !== null) {
        var fiber = nextEffect;
        var firstChild = fiber.child;
        if ((fiber.subtreeFlags & LayoutMask) !== NoFlags && firstChild !== null) {
          firstChild.return = fiber;
          nextEffect = firstChild;
        } else {
          commitLayoutMountEffects_complete(subtreeRoot, root, committedLanes);
        }
      }
    }
    function commitLayoutMountEffects_complete(subtreeRoot, root, committedLanes) {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        if ((fiber.flags & LayoutMask) !== NoFlags) {
          var current = fiber.alternate;
          setCurrentFiber(fiber);
          try {
            commitLayoutEffectOnFiber(root, current, fiber, committedLanes);
          } catch (error) {
            captureCommitPhaseError(fiber, fiber.return, error);
          }
          resetCurrentFiber();
        }
        if (fiber === subtreeRoot) {
          nextEffect = null;
          return;
        }
        var sibling = fiber.sibling;
        if (sibling !== null) {
          sibling.return = fiber.return;
          nextEffect = sibling;
          return;
        }
        nextEffect = fiber.return;
      }
    }
    function commitPassiveMountEffects(root, finishedWork, committedLanes, committedTransitions) {
      nextEffect = finishedWork;
      commitPassiveMountEffects_begin(finishedWork, root, committedLanes, committedTransitions);
    }
    function commitPassiveMountEffects_begin(subtreeRoot, root, committedLanes, committedTransitions) {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        var firstChild = fiber.child;
        if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && firstChild !== null) {
          firstChild.return = fiber;
          nextEffect = firstChild;
        } else {
          commitPassiveMountEffects_complete(subtreeRoot, root, committedLanes, committedTransitions);
        }
      }
    }
    function commitPassiveMountEffects_complete(subtreeRoot, root, committedLanes, committedTransitions) {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        if ((fiber.flags & Passive) !== NoFlags) {
          setCurrentFiber(fiber);
          try {
            commitPassiveMountOnFiber(root, fiber, committedLanes, committedTransitions);
          } catch (error) {
            captureCommitPhaseError(fiber, fiber.return, error);
          }
          resetCurrentFiber();
        }
        if (fiber === subtreeRoot) {
          nextEffect = null;
          return;
        }
        var sibling = fiber.sibling;
        if (sibling !== null) {
          sibling.return = fiber.return;
          nextEffect = sibling;
          return;
        }
        nextEffect = fiber.return;
      }
    }
    function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent:
          {
            if (finishedWork.mode & ProfileMode) {
              startPassiveEffectTimer();
              try {
                commitHookEffectListMount(Passive$1 | HasEffect, finishedWork);
              } finally {
                recordPassiveEffectDuration(finishedWork);
              }
            } else {
              commitHookEffectListMount(Passive$1 | HasEffect, finishedWork);
            }
            break;
          }
      }
    }
    function commitPassiveUnmountEffects(firstChild) {
      nextEffect = firstChild;
      commitPassiveUnmountEffects_begin();
    }
    function commitPassiveUnmountEffects_begin() {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        var child = fiber.child;
        if ((nextEffect.flags & ChildDeletion) !== NoFlags) {
          var deletions = fiber.deletions;
          if (deletions !== null) {
            for (var i = 0; i < deletions.length; i++) {
              var fiberToDelete = deletions[i];
              nextEffect = fiberToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(fiberToDelete, fiber);
            }
            {
              var previousFiber = fiber.alternate;
              if (previousFiber !== null) {
                var detachedChild = previousFiber.child;
                if (detachedChild !== null) {
                  previousFiber.child = null;
                  do {
                    var detachedSibling = detachedChild.sibling;
                    detachedChild.sibling = null;
                    detachedChild = detachedSibling;
                  } while (detachedChild !== null);
                }
              }
            }
            nextEffect = fiber;
          }
        }
        if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && child !== null) {
          child.return = fiber;
          nextEffect = child;
        } else {
          commitPassiveUnmountEffects_complete();
        }
      }
    }
    function commitPassiveUnmountEffects_complete() {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        if ((fiber.flags & Passive) !== NoFlags) {
          setCurrentFiber(fiber);
          commitPassiveUnmountOnFiber(fiber);
          resetCurrentFiber();
        }
        var sibling = fiber.sibling;
        if (sibling !== null) {
          sibling.return = fiber.return;
          nextEffect = sibling;
          return;
        }
        nextEffect = fiber.return;
      }
    }
    function commitPassiveUnmountOnFiber(finishedWork) {
      switch (finishedWork.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent:
          {
            if (finishedWork.mode & ProfileMode) {
              startPassiveEffectTimer();
              commitHookEffectListUnmount(Passive$1 | HasEffect, finishedWork, finishedWork.return);
              recordPassiveEffectDuration(finishedWork);
            } else {
              commitHookEffectListUnmount(Passive$1 | HasEffect, finishedWork, finishedWork.return);
            }
            break;
          }
      }
    }
    function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        setCurrentFiber(fiber);
        commitPassiveUnmountInsideDeletedTreeOnFiber(fiber, nearestMountedAncestor);
        resetCurrentFiber();
        var child = fiber.child;
        if (child !== null) {
          child.return = fiber;
          nextEffect = child;
        } else {
          commitPassiveUnmountEffectsInsideOfDeletedTree_complete(deletedSubtreeRoot);
        }
      }
    }
    function commitPassiveUnmountEffectsInsideOfDeletedTree_complete(deletedSubtreeRoot) {
      while (nextEffect !== null) {
        var fiber = nextEffect;
        var sibling = fiber.sibling;
        var returnFiber = fiber.return;
        {
          detachFiberAfterEffects(fiber);
          if (fiber === deletedSubtreeRoot) {
            nextEffect = null;
            return;
          }
        }
        if (sibling !== null) {
          sibling.return = returnFiber;
          nextEffect = sibling;
          return;
        }
        nextEffect = returnFiber;
      }
    }
    function commitPassiveUnmountInsideDeletedTreeOnFiber(current, nearestMountedAncestor) {
      switch (current.tag) {
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent:
          {
            if (current.mode & ProfileMode) {
              startPassiveEffectTimer();
              commitHookEffectListUnmount(Passive$1, current, nearestMountedAncestor);
              recordPassiveEffectDuration(current);
            } else {
              commitHookEffectListUnmount(Passive$1, current, nearestMountedAncestor);
            }
            break;
          }
      }
    }
    var COMPONENT_TYPE = 0;
    var HAS_PSEUDO_CLASS_TYPE = 1;
    var ROLE_TYPE = 2;
    var TEST_NAME_TYPE = 3;
    var TEXT_TYPE = 4;
    if (typeof Symbol === "function" && Symbol.for) {
      var symbolFor = Symbol.for;
      COMPONENT_TYPE = symbolFor("selector.component");
      HAS_PSEUDO_CLASS_TYPE = symbolFor("selector.has_pseudo_class");
      ROLE_TYPE = symbolFor("selector.role");
      TEST_NAME_TYPE = symbolFor("selector.test_id");
      TEXT_TYPE = symbolFor("selector.text");
    }
    var ReactCurrentActQueue = ReactSharedInternals.ReactCurrentActQueue;
    function isLegacyActEnvironment(fiber) {
      {
        var isReactActEnvironmentGlobal = typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" ? IS_REACT_ACT_ENVIRONMENT : undefined;
        var jestIsDefined = typeof jest !== "undefined";
        return jestIsDefined && isReactActEnvironmentGlobal !== false;
      }
    }
    function isConcurrentActEnvironment() {
      {
        var isReactActEnvironmentGlobal = typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" ? IS_REACT_ACT_ENVIRONMENT : undefined;
        if (!isReactActEnvironmentGlobal && ReactCurrentActQueue.current !== null) {
          error("The current testing environment is not configured to support " + "act(...)");
        }
        return isReactActEnvironmentGlobal;
      }
    }
    var ceil = Math.ceil;
    var ReactCurrentDispatcher$2 = ReactSharedInternals.ReactCurrentDispatcher,
      ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
      ReactCurrentBatchConfig$2 = ReactSharedInternals.ReactCurrentBatchConfig,
      ReactCurrentActQueue$1 = ReactSharedInternals.ReactCurrentActQueue;
    var NoContext = 0;
    var BatchedContext = 1;
    var RenderContext = 2;
    var CommitContext = 4;
    var RootInProgress = 0;
    var RootFatalErrored = 1;
    var RootErrored = 2;
    var RootSuspended = 3;
    var RootSuspendedWithDelay = 4;
    var RootCompleted = 5;
    var RootDidNotComplete = 6;
    var executionContext = NoContext;
    var workInProgressRoot = null;
    var workInProgress = null;
    var workInProgressRootRenderLanes = NoLanes;
    var subtreeRenderLanes = NoLanes;
    var subtreeRenderLanesCursor = createCursor(NoLanes);
    var workInProgressRootExitStatus = RootInProgress;
    var workInProgressRootFatalError = null;
    var workInProgressRootIncludedLanes = NoLanes;
    var workInProgressRootSkippedLanes = NoLanes;
    var workInProgressRootInterleavedUpdatedLanes = NoLanes;
    var workInProgressRootPingedLanes = NoLanes;
    var workInProgressRootConcurrentErrors = null;
    var workInProgressRootRecoverableErrors = null;
    var globalMostRecentFallbackTime = 0;
    var FALLBACK_THROTTLE_MS = 500;
    var workInProgressRootRenderTargetTime = Infinity;
    var RENDER_TIMEOUT_MS = 500;
    var workInProgressTransitions = null;
    function resetRenderTimer() {
      workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS;
    }
    function getRenderTargetTime() {
      return workInProgressRootRenderTargetTime;
    }
    var hasUncaughtError = false;
    var firstUncaughtError = null;
    var legacyErrorBoundariesThatAlreadyFailed = null;
    var rootDoesHavePassiveEffects = false;
    var rootWithPendingPassiveEffects = null;
    var pendingPassiveEffectsLanes = NoLanes;
    var pendingPassiveProfilerEffects = [];
    var pendingPassiveTransitions = null;
    var NESTED_UPDATE_LIMIT = 50;
    var nestedUpdateCount = 0;
    var rootWithNestedUpdates = null;
    var isFlushingPassiveEffects = false;
    var didScheduleUpdateDuringPassiveEffects = false;
    var NESTED_PASSIVE_UPDATE_LIMIT = 50;
    var nestedPassiveUpdateCount = 0;
    var rootWithPassiveNestedUpdates = null;
    var currentEventTime = NoTimestamp;
    var currentEventTransitionLane = NoLanes;
    var isRunningInsertionEffect = false;
    function getWorkInProgressRoot() {
      return workInProgressRoot;
    }
    function requestEventTime() {
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        return now();
      }
      if (currentEventTime !== NoTimestamp) {
        return currentEventTime;
      }
      currentEventTime = now();
      return currentEventTime;
    }
    function requestUpdateLane(fiber) {
      var mode = fiber.mode;
      if ((mode & ConcurrentMode) === NoMode) {
        return SyncLane;
      } else if ((executionContext & RenderContext) !== NoContext && workInProgressRootRenderLanes !== NoLanes) {
        return pickArbitraryLane(workInProgressRootRenderLanes);
      }
      var isTransition = requestCurrentTransition() !== NoTransition;
      if (isTransition) {
        if (ReactCurrentBatchConfig$2.transition !== null) {
          var transition = ReactCurrentBatchConfig$2.transition;
          if (!transition._updatedFibers) {
            transition._updatedFibers = new Set();
          }
          transition._updatedFibers.add(fiber);
        }
        if (currentEventTransitionLane === NoLane) {
          currentEventTransitionLane = claimNextTransitionLane();
        }
        return currentEventTransitionLane;
      }
      var updateLane = getCurrentUpdatePriority();
      if (updateLane !== NoLane) {
        return updateLane;
      }
      var eventLane = getCurrentEventPriority();
      return eventLane;
    }
    function requestRetryLane(fiber) {
      var mode = fiber.mode;
      if ((mode & ConcurrentMode) === NoMode) {
        return SyncLane;
      }
      return claimNextRetryLane();
    }
    function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
      checkForNestedUpdates();
      {
        if (isRunningInsertionEffect) {
          error("useInsertionEffect must not schedule updates.");
        }
      }
      {
        if (isFlushingPassiveEffects) {
          didScheduleUpdateDuringPassiveEffects = true;
        }
      }
      markRootUpdated(root, lane, eventTime);
      if ((executionContext & RenderContext) !== NoLanes && root === workInProgressRoot) {
        warnAboutRenderPhaseUpdatesInDEV(fiber);
      } else {
        {
          if (isDevToolsPresent) {
            addFiberToLanesMap(root, fiber, lane);
          }
        }
        warnIfUpdatesNotWrappedWithActDEV(fiber);
        if (root === workInProgressRoot) {
          if ((executionContext & RenderContext) === NoContext) {
            workInProgressRootInterleavedUpdatedLanes = mergeLanes(workInProgressRootInterleavedUpdatedLanes, lane);
          }
          if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
            markRootSuspended$1(root, workInProgressRootRenderLanes);
          }
        }
        ensureRootIsScheduled(root, eventTime);
        if (lane === SyncLane && executionContext === NoContext && (fiber.mode & ConcurrentMode) === NoMode && !ReactCurrentActQueue$1.isBatchingLegacy) {
          resetRenderTimer();
          flushSyncCallbacksOnlyInLegacyMode();
        }
      }
    }
    function isUnsafeClassRenderPhaseUpdate(fiber) {
      return (executionContext & RenderContext) !== NoContext;
    }
    function ensureRootIsScheduled(root, currentTime) {
      var existingCallbackNode = root.callbackNode;
      markStarvedLanesAsExpired(root, currentTime);
      var nextLanes = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes);
      if (nextLanes === NoLanes) {
        if (existingCallbackNode !== null) {
          cancelCallback$1(existingCallbackNode);
        }
        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return;
      }
      var newCallbackPriority = getHighestPriorityLane(nextLanes);
      var existingCallbackPriority = root.callbackPriority;
      if (existingCallbackPriority === newCallbackPriority && !(ReactCurrentActQueue$1.current !== null && existingCallbackNode !== fakeActCallbackNode)) {
        {
          if (existingCallbackNode == null && existingCallbackPriority !== SyncLane) {
            error("Expected scheduled callback to exist. This error is likely caused by a bug in React. Please file an issue.");
          }
        }
        return;
      }
      if (existingCallbackNode != null) {
        cancelCallback$1(existingCallbackNode);
      }
      var newCallbackNode;
      if (newCallbackPriority === SyncLane) {
        if (root.tag === LegacyRoot) {
          if (ReactCurrentActQueue$1.isBatchingLegacy !== null) {
            ReactCurrentActQueue$1.didScheduleLegacyUpdate = true;
          }
          scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
        } else {
          scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
        }
        {
          scheduleCallback$1(ImmediatePriority, flushSyncCallbacks);
        }
        newCallbackNode = null;
      } else {
        var schedulerPriorityLevel;
        switch (lanesToEventPriority(nextLanes)) {
          case DiscreteEventPriority:
            schedulerPriorityLevel = ImmediatePriority;
            break;
          case ContinuousEventPriority:
            schedulerPriorityLevel = UserBlockingPriority;
            break;
          case DefaultEventPriority:
            schedulerPriorityLevel = NormalPriority;
            break;
          case IdleEventPriority:
            schedulerPriorityLevel = IdlePriority;
            break;
          default:
            schedulerPriorityLevel = NormalPriority;
            break;
        }
        newCallbackNode = scheduleCallback$1(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));
      }
      root.callbackPriority = newCallbackPriority;
      root.callbackNode = newCallbackNode;
    }
    function performConcurrentWorkOnRoot(root, didTimeout) {
      {
        resetNestedUpdateFlag();
      }
      currentEventTime = NoTimestamp;
      currentEventTransitionLane = NoLanes;
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Should not already be working.");
      }
      var originalCallbackNode = root.callbackNode;
      var didFlushPassiveEffects = flushPassiveEffects();
      if (didFlushPassiveEffects) {
        if (root.callbackNode !== originalCallbackNode) {
          return null;
        }
      }
      var lanes = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes);
      if (lanes === NoLanes) {
        return null;
      }
      var shouldTimeSlice = !includesBlockingLane(root, lanes) && !includesExpiredLane(root, lanes) && !didTimeout;
      var exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes);
      if (exitStatus !== RootInProgress) {
        if (exitStatus === RootErrored) {
          var errorRetryLanes = getLanesToRetrySynchronouslyOnError(root);
          if (errorRetryLanes !== NoLanes) {
            lanes = errorRetryLanes;
            exitStatus = recoverFromConcurrentError(root, errorRetryLanes);
          }
        }
        if (exitStatus === RootFatalErrored) {
          var fatalError = workInProgressRootFatalError;
          prepareFreshStack(root, NoLanes);
          markRootSuspended$1(root, lanes);
          ensureRootIsScheduled(root, now());
          throw fatalError;
        }
        if (exitStatus === RootDidNotComplete) {
          markRootSuspended$1(root, lanes);
        } else {
          var renderWasConcurrent = !includesBlockingLane(root, lanes);
          var finishedWork = root.current.alternate;
          if (renderWasConcurrent && !isRenderConsistentWithExternalStores(finishedWork)) {
            exitStatus = renderRootSync(root, lanes);
            if (exitStatus === RootErrored) {
              var _errorRetryLanes = getLanesToRetrySynchronouslyOnError(root);
              if (_errorRetryLanes !== NoLanes) {
                lanes = _errorRetryLanes;
                exitStatus = recoverFromConcurrentError(root, _errorRetryLanes);
              }
            }
            if (exitStatus === RootFatalErrored) {
              var _fatalError = workInProgressRootFatalError;
              prepareFreshStack(root, NoLanes);
              markRootSuspended$1(root, lanes);
              ensureRootIsScheduled(root, now());
              throw _fatalError;
            }
          }
          root.finishedWork = finishedWork;
          root.finishedLanes = lanes;
          finishConcurrentRender(root, exitStatus, lanes);
        }
      }
      ensureRootIsScheduled(root, now());
      if (root.callbackNode === originalCallbackNode) {
        return performConcurrentWorkOnRoot.bind(null, root);
      }
      return null;
    }
    function recoverFromConcurrentError(root, errorRetryLanes) {
      var errorsFromFirstAttempt = workInProgressRootConcurrentErrors;
      if (isRootDehydrated(root)) {
        var rootWorkInProgress = prepareFreshStack(root, errorRetryLanes);
        rootWorkInProgress.flags |= ForceClientRender;
        {
          errorHydratingContainer(root.containerInfo);
        }
      }
      var exitStatus = renderRootSync(root, errorRetryLanes);
      if (exitStatus !== RootErrored) {
        var errorsFromSecondAttempt = workInProgressRootRecoverableErrors;
        workInProgressRootRecoverableErrors = errorsFromFirstAttempt;
        if (errorsFromSecondAttempt !== null) {
          queueRecoverableErrors(errorsFromSecondAttempt);
        }
      }
      return exitStatus;
    }
    function queueRecoverableErrors(errors) {
      if (workInProgressRootRecoverableErrors === null) {
        workInProgressRootRecoverableErrors = errors;
      } else {
        workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, errors);
      }
    }
    function finishConcurrentRender(root, exitStatus, lanes) {
      switch (exitStatus) {
        case RootInProgress:
        case RootFatalErrored:
          {
            throw new Error("Root did not complete. This is a bug in React.");
          }
        case RootErrored:
          {
            commitRoot(root, workInProgressRootRecoverableErrors, workInProgressTransitions);
            break;
          }
        case RootSuspended:
          {
            markRootSuspended$1(root, lanes);
            if (includesOnlyRetries(lanes) && !shouldForceFlushFallbacksInDEV()) {
              var msUntilTimeout = globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now();
              if (msUntilTimeout > 10) {
                var nextLanes = getNextLanes(root, NoLanes);
                if (nextLanes !== NoLanes) {
                  break;
                }
                var suspendedLanes = root.suspendedLanes;
                if (!isSubsetOfLanes(suspendedLanes, lanes)) {
                  var eventTime = requestEventTime();
                  markRootPinged(root, suspendedLanes);
                  break;
                }
                root.timeoutHandle = scheduleTimeout(commitRoot.bind(null, root, workInProgressRootRecoverableErrors, workInProgressTransitions), msUntilTimeout);
                break;
              }
            }
            commitRoot(root, workInProgressRootRecoverableErrors, workInProgressTransitions);
            break;
          }
        case RootSuspendedWithDelay:
          {
            markRootSuspended$1(root, lanes);
            if (includesOnlyTransitions(lanes)) {
              break;
            }
            if (!shouldForceFlushFallbacksInDEV()) {
              var mostRecentEventTime = getMostRecentEventTime(root, lanes);
              var eventTimeMs = mostRecentEventTime;
              var timeElapsedMs = now() - eventTimeMs;
              var _msUntilTimeout = jnd(timeElapsedMs) - timeElapsedMs;
              if (_msUntilTimeout > 10) {
                root.timeoutHandle = scheduleTimeout(commitRoot.bind(null, root, workInProgressRootRecoverableErrors, workInProgressTransitions), _msUntilTimeout);
                break;
              }
            }
            commitRoot(root, workInProgressRootRecoverableErrors, workInProgressTransitions);
            break;
          }
        case RootCompleted:
          {
            commitRoot(root, workInProgressRootRecoverableErrors, workInProgressTransitions);
            break;
          }
        default:
          {
            throw new Error("Unknown root exit status.");
          }
      }
    }
    function isRenderConsistentWithExternalStores(finishedWork) {
      var node = finishedWork;
      while (true) {
        if (node.flags & StoreConsistency) {
          var updateQueue = node.updateQueue;
          if (updateQueue !== null) {
            var checks = updateQueue.stores;
            if (checks !== null) {
              for (var i = 0; i < checks.length; i++) {
                var check = checks[i];
                var getSnapshot = check.getSnapshot;
                var renderedValue = check.value;
                try {
                  if (!objectIs(getSnapshot(), renderedValue)) {
                    return false;
                  }
                } catch (error) {
                  return false;
                }
              }
            }
          }
        }
        var child = node.child;
        if (node.subtreeFlags & StoreConsistency && child !== null) {
          child.return = node;
          node = child;
          continue;
        }
        if (node === finishedWork) {
          return true;
        }
        while (node.sibling === null) {
          if (node.return === null || node.return === finishedWork) {
            return true;
          }
          node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
      }
      return true;
    }
    function markRootSuspended$1(root, suspendedLanes) {
      suspendedLanes = removeLanes(suspendedLanes, workInProgressRootPingedLanes);
      suspendedLanes = removeLanes(suspendedLanes, workInProgressRootInterleavedUpdatedLanes);
      markRootSuspended(root, suspendedLanes);
    }
    function performSyncWorkOnRoot(root) {
      {
        syncNestedUpdateFlag();
      }
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Should not already be working.");
      }
      flushPassiveEffects();
      var lanes = getNextLanes(root, NoLanes);
      if (!includesSomeLane(lanes, SyncLane)) {
        ensureRootIsScheduled(root, now());
        return null;
      }
      var exitStatus = renderRootSync(root, lanes);
      if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
        var errorRetryLanes = getLanesToRetrySynchronouslyOnError(root);
        if (errorRetryLanes !== NoLanes) {
          lanes = errorRetryLanes;
          exitStatus = recoverFromConcurrentError(root, errorRetryLanes);
        }
      }
      if (exitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        prepareFreshStack(root, NoLanes);
        markRootSuspended$1(root, lanes);
        ensureRootIsScheduled(root, now());
        throw fatalError;
      }
      if (exitStatus === RootDidNotComplete) {
        throw new Error("Root did not complete. This is a bug in React.");
      }
      var finishedWork = root.current.alternate;
      root.finishedWork = finishedWork;
      root.finishedLanes = lanes;
      commitRoot(root, workInProgressRootRecoverableErrors, workInProgressTransitions);
      ensureRootIsScheduled(root, now());
      return null;
    }
    function batchedUpdates$1(fn, a) {
      var prevExecutionContext = executionContext;
      executionContext |= BatchedContext;
      try {
        return fn(a);
      } finally {
        executionContext = prevExecutionContext;
        if (executionContext === NoContext && !ReactCurrentActQueue$1.isBatchingLegacy) {
          resetRenderTimer();
          flushSyncCallbacksOnlyInLegacyMode();
        }
      }
    }
    function flushSync(fn) {
      if (rootWithPendingPassiveEffects !== null && rootWithPendingPassiveEffects.tag === LegacyRoot && (executionContext & (RenderContext | CommitContext)) === NoContext) {
        flushPassiveEffects();
      }
      var prevExecutionContext = executionContext;
      executionContext |= BatchedContext;
      var prevTransition = ReactCurrentBatchConfig$2.transition;
      var previousPriority = getCurrentUpdatePriority();
      try {
        ReactCurrentBatchConfig$2.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        if (fn) {
          return fn();
        } else {
          return undefined;
        }
      } finally {
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig$2.transition = prevTransition;
        executionContext = prevExecutionContext;
        if ((executionContext & (RenderContext | CommitContext)) === NoContext) {
          flushSyncCallbacks();
        }
      }
    }
    function pushRenderLanes(fiber, lanes) {
      push(subtreeRenderLanesCursor, subtreeRenderLanes, fiber);
      subtreeRenderLanes = mergeLanes(subtreeRenderLanes, lanes);
      workInProgressRootIncludedLanes = mergeLanes(workInProgressRootIncludedLanes, lanes);
    }
    function popRenderLanes(fiber) {
      subtreeRenderLanes = subtreeRenderLanesCursor.current;
      pop(subtreeRenderLanesCursor, fiber);
    }
    function prepareFreshStack(root, lanes) {
      root.finishedWork = null;
      root.finishedLanes = NoLanes;
      var timeoutHandle = root.timeoutHandle;
      if (timeoutHandle !== noTimeout) {
        root.timeoutHandle = noTimeout;
        cancelTimeout(timeoutHandle);
      }
      if (workInProgress !== null) {
        var interruptedWork = workInProgress.return;
        while (interruptedWork !== null) {
          var current = interruptedWork.alternate;
          unwindInterruptedWork(current, interruptedWork);
          interruptedWork = interruptedWork.return;
        }
      }
      workInProgressRoot = root;
      var rootWorkInProgress = createWorkInProgress(root.current, null);
      workInProgress = rootWorkInProgress;
      workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
      workInProgressRootExitStatus = RootInProgress;
      workInProgressRootFatalError = null;
      workInProgressRootSkippedLanes = NoLanes;
      workInProgressRootInterleavedUpdatedLanes = NoLanes;
      workInProgressRootPingedLanes = NoLanes;
      workInProgressRootConcurrentErrors = null;
      workInProgressRootRecoverableErrors = null;
      finishQueueingConcurrentUpdates();
      {
        ReactStrictModeWarnings.discardPendingWarnings();
      }
      return rootWorkInProgress;
    }
    function handleError(root, thrownValue) {
      do {
        var erroredWork = workInProgress;
        try {
          resetContextDependencies();
          resetHooksAfterThrow();
          resetCurrentFiber();
          ReactCurrentOwner$2.current = null;
          if (erroredWork === null || erroredWork.return === null) {
            workInProgressRootExitStatus = RootFatalErrored;
            workInProgressRootFatalError = thrownValue;
            workInProgress = null;
            return;
          }
          if (enableProfilerTimer && erroredWork.mode & ProfileMode) {
            stopProfilerTimerIfRunningAndRecordDelta(erroredWork, true);
          }
          if (enableSchedulingProfiler) {
            markComponentRenderStopped();
            if (thrownValue !== null && typeof thrownValue === "object" && typeof thrownValue.then === "function") {
              var wakeable = thrownValue;
              markComponentSuspended(erroredWork, wakeable, workInProgressRootRenderLanes);
            } else {
              markComponentErrored(erroredWork, thrownValue, workInProgressRootRenderLanes);
            }
          }
          throwException(root, erroredWork.return, erroredWork, thrownValue, workInProgressRootRenderLanes);
          completeUnitOfWork(erroredWork);
        } catch (yetAnotherThrownValue) {
          thrownValue = yetAnotherThrownValue;
          if (workInProgress === erroredWork && erroredWork !== null) {
            erroredWork = erroredWork.return;
            workInProgress = erroredWork;
          } else {
            erroredWork = workInProgress;
          }
          continue;
        }
        return;
      } while (true);
    }
    function pushDispatcher() {
      var prevDispatcher = ReactCurrentDispatcher$2.current;
      ReactCurrentDispatcher$2.current = ContextOnlyDispatcher;
      if (prevDispatcher === null) {
        return ContextOnlyDispatcher;
      } else {
        return prevDispatcher;
      }
    }
    function popDispatcher(prevDispatcher) {
      ReactCurrentDispatcher$2.current = prevDispatcher;
    }
    function markCommitTimeOfFallback() {
      globalMostRecentFallbackTime = now();
    }
    function markSkippedUpdateLanes(lane) {
      workInProgressRootSkippedLanes = mergeLanes(lane, workInProgressRootSkippedLanes);
    }
    function renderDidSuspend() {
      if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootSuspended;
      }
    }
    function renderDidSuspendDelayIfPossible() {
      if (workInProgressRootExitStatus === RootInProgress || workInProgressRootExitStatus === RootSuspended || workInProgressRootExitStatus === RootErrored) {
        workInProgressRootExitStatus = RootSuspendedWithDelay;
      }
      if (workInProgressRoot !== null && (includesNonIdleWork(workInProgressRootSkippedLanes) || includesNonIdleWork(workInProgressRootInterleavedUpdatedLanes))) {
        markRootSuspended$1(workInProgressRoot, workInProgressRootRenderLanes);
      }
    }
    function renderDidError(error) {
      if (workInProgressRootExitStatus !== RootSuspendedWithDelay) {
        workInProgressRootExitStatus = RootErrored;
      }
      if (workInProgressRootConcurrentErrors === null) {
        workInProgressRootConcurrentErrors = [error];
      } else {
        workInProgressRootConcurrentErrors.push(error);
      }
    }
    function renderHasNotSuspendedYet() {
      return workInProgressRootExitStatus === RootInProgress;
    }
    function renderRootSync(root, lanes) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher();
      if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
        {
          if (isDevToolsPresent) {
            var memoizedUpdaters = root.memoizedUpdaters;
            if (memoizedUpdaters.size > 0) {
              restorePendingUpdaters(root, workInProgressRootRenderLanes);
              memoizedUpdaters.clear();
            }
            movePendingFibersToMemoized(root, lanes);
          }
        }
        workInProgressTransitions = getTransitionsForLanes();
        prepareFreshStack(root, lanes);
      }
      do {
        try {
          workLoopSync();
          break;
        } catch (thrownValue) {
          handleError(root, thrownValue);
        }
      } while (true);
      resetContextDependencies();
      executionContext = prevExecutionContext;
      popDispatcher(prevDispatcher);
      if (workInProgress !== null) {
        throw new Error("Cannot commit an incomplete root. This error is likely caused by a " + "bug in React. Please file an issue.");
      }
      workInProgressRoot = null;
      workInProgressRootRenderLanes = NoLanes;
      return workInProgressRootExitStatus;
    }
    function workLoopSync() {
      while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
      }
    }
    function renderRootConcurrent(root, lanes) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher();
      if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
        {
          if (isDevToolsPresent) {
            var memoizedUpdaters = root.memoizedUpdaters;
            if (memoizedUpdaters.size > 0) {
              restorePendingUpdaters(root, workInProgressRootRenderLanes);
              memoizedUpdaters.clear();
            }
            movePendingFibersToMemoized(root, lanes);
          }
        }
        workInProgressTransitions = getTransitionsForLanes();
        resetRenderTimer();
        prepareFreshStack(root, lanes);
      }
      do {
        try {
          workLoopConcurrent();
          break;
        } catch (thrownValue) {
          handleError(root, thrownValue);
        }
      } while (true);
      resetContextDependencies();
      popDispatcher(prevDispatcher);
      executionContext = prevExecutionContext;
      if (workInProgress !== null) {
        return RootInProgress;
      } else {
        workInProgressRoot = null;
        workInProgressRootRenderLanes = NoLanes;
        return workInProgressRootExitStatus;
      }
    }
    function workLoopConcurrent() {
      while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
      }
    }
    function performUnitOfWork(unitOfWork) {
      var current = unitOfWork.alternate;
      setCurrentFiber(unitOfWork);
      var next;
      if ((unitOfWork.mode & ProfileMode) !== NoMode) {
        startProfilerTimer(unitOfWork);
        next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
        stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
      } else {
        next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
      }
      resetCurrentFiber();
      unitOfWork.memoizedProps = unitOfWork.pendingProps;
      if (next === null) {
        completeUnitOfWork(unitOfWork);
      } else {
        workInProgress = next;
      }
      ReactCurrentOwner$2.current = null;
    }
    function completeUnitOfWork(unitOfWork) {
      var completedWork = unitOfWork;
      do {
        var current = completedWork.alternate;
        var returnFiber = completedWork.return;
        if ((completedWork.flags & Incomplete) === NoFlags) {
          setCurrentFiber(completedWork);
          var next = void 0;
          if ((completedWork.mode & ProfileMode) === NoMode) {
            next = completeWork(current, completedWork, subtreeRenderLanes);
          } else {
            startProfilerTimer(completedWork);
            next = completeWork(current, completedWork, subtreeRenderLanes);
            stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
          }
          resetCurrentFiber();
          if (next !== null) {
            workInProgress = next;
            return;
          }
        } else {
          var _next = unwindWork(current, completedWork);
          if (_next !== null) {
            _next.flags &= HostEffectMask;
            workInProgress = _next;
            return;
          }
          if ((completedWork.mode & ProfileMode) !== NoMode) {
            stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
            var actualDuration = completedWork.actualDuration;
            var child = completedWork.child;
            while (child !== null) {
              actualDuration += child.actualDuration;
              child = child.sibling;
            }
            completedWork.actualDuration = actualDuration;
          }
          if (returnFiber !== null) {
            returnFiber.flags |= Incomplete;
            returnFiber.subtreeFlags = NoFlags;
            returnFiber.deletions = null;
          } else {
            workInProgressRootExitStatus = RootDidNotComplete;
            workInProgress = null;
            return;
          }
        }
        var siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
          workInProgress = siblingFiber;
          return;
        }
        completedWork = returnFiber;
        workInProgress = completedWork;
      } while (completedWork !== null);
      if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted;
      }
    }
    function commitRoot(root, recoverableErrors, transitions) {
      var previousUpdateLanePriority = getCurrentUpdatePriority();
      var prevTransition = ReactCurrentBatchConfig$2.transition;
      try {
        ReactCurrentBatchConfig$2.transition = null;
        setCurrentUpdatePriority(DiscreteEventPriority);
        commitRootImpl(root, recoverableErrors, transitions, previousUpdateLanePriority);
      } finally {
        ReactCurrentBatchConfig$2.transition = prevTransition;
        setCurrentUpdatePriority(previousUpdateLanePriority);
      }
      return null;
    }
    function commitRootImpl(root, recoverableErrors, transitions, renderPriorityLevel) {
      do {
        flushPassiveEffects();
      } while (rootWithPendingPassiveEffects !== null);
      flushRenderPhaseStrictModeWarningsInDEV();
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Should not already be working.");
      }
      var finishedWork = root.finishedWork;
      var lanes = root.finishedLanes;
      if (finishedWork === null) {
        return null;
      } else {
        {
          if (lanes === NoLanes) {
            error("root.finishedLanes should not be empty during a commit. This is a " + "bug in React.");
          }
        }
      }
      root.finishedWork = null;
      root.finishedLanes = NoLanes;
      if (finishedWork === root.current) {
        throw new Error("Cannot commit the same tree as before. This error is likely caused by " + "a bug in React. Please file an issue.");
      }
      root.callbackNode = null;
      root.callbackPriority = NoLane;
      var remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
      markRootFinished(root, remainingLanes);
      if (root === workInProgressRoot) {
        workInProgressRoot = null;
        workInProgress = null;
        workInProgressRootRenderLanes = NoLanes;
      }
      if ((finishedWork.subtreeFlags & PassiveMask) !== NoFlags || (finishedWork.flags & PassiveMask) !== NoFlags) {
        if (!rootDoesHavePassiveEffects) {
          rootDoesHavePassiveEffects = true;
          pendingPassiveTransitions = transitions;
          scheduleCallback$1(NormalPriority, function () {
            flushPassiveEffects();
            return null;
          });
        }
      }
      var subtreeHasEffects = (finishedWork.subtreeFlags & (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !== NoFlags;
      var rootHasEffect = (finishedWork.flags & (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !== NoFlags;
      if (subtreeHasEffects || rootHasEffect) {
        var prevTransition = ReactCurrentBatchConfig$2.transition;
        ReactCurrentBatchConfig$2.transition = null;
        var previousPriority = getCurrentUpdatePriority();
        setCurrentUpdatePriority(DiscreteEventPriority);
        var prevExecutionContext = executionContext;
        executionContext |= CommitContext;
        ReactCurrentOwner$2.current = null;
        var shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(root, finishedWork);
        {
          recordCommitTime();
        }
        commitMutationEffects(root, finishedWork, lanes);
        resetAfterCommit(root.containerInfo);
        root.current = finishedWork;
        commitLayoutEffects(finishedWork, root, lanes);
        requestPaint();
        executionContext = prevExecutionContext;
        setCurrentUpdatePriority(previousPriority);
        ReactCurrentBatchConfig$2.transition = prevTransition;
      } else {
        root.current = finishedWork;
        {
          recordCommitTime();
        }
      }
      if (rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = false;
        rootWithPendingPassiveEffects = root;
        pendingPassiveEffectsLanes = lanes;
      } else {
        {
          nestedPassiveUpdateCount = 0;
          rootWithPassiveNestedUpdates = null;
        }
      }
      remainingLanes = root.pendingLanes;
      if (remainingLanes === NoLanes) {
        legacyErrorBoundariesThatAlreadyFailed = null;
      }
      onCommitRoot(finishedWork.stateNode, renderPriorityLevel);
      {
        if (isDevToolsPresent) {
          root.memoizedUpdaters.clear();
        }
      }
      ensureRootIsScheduled(root, now());
      if (recoverableErrors !== null) {
        var onRecoverableError = root.onRecoverableError;
        for (var i = 0; i < recoverableErrors.length; i++) {
          var recoverableError = recoverableErrors[i];
          var componentStack = recoverableError.stack;
          var digest = recoverableError.digest;
          onRecoverableError(recoverableError.value, {
            componentStack: componentStack,
            digest: digest
          });
        }
      }
      if (hasUncaughtError) {
        hasUncaughtError = false;
        var error$1 = firstUncaughtError;
        firstUncaughtError = null;
        throw error$1;
      }
      if (includesSomeLane(pendingPassiveEffectsLanes, SyncLane) && root.tag !== LegacyRoot) {
        flushPassiveEffects();
      }
      remainingLanes = root.pendingLanes;
      if (includesSomeLane(remainingLanes, SyncLane)) {
        {
          markNestedUpdateScheduled();
        }
        if (root === rootWithNestedUpdates) {
          nestedUpdateCount++;
        } else {
          nestedUpdateCount = 0;
          rootWithNestedUpdates = root;
        }
      } else {
        nestedUpdateCount = 0;
      }
      flushSyncCallbacks();
      return null;
    }
    function flushPassiveEffects() {
      if (rootWithPendingPassiveEffects !== null) {
        var renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes);
        var priority = lowerEventPriority(DefaultEventPriority, renderPriority);
        var prevTransition = ReactCurrentBatchConfig$2.transition;
        var previousPriority = getCurrentUpdatePriority();
        try {
          ReactCurrentBatchConfig$2.transition = null;
          setCurrentUpdatePriority(priority);
          return flushPassiveEffectsImpl();
        } finally {
          setCurrentUpdatePriority(previousPriority);
          ReactCurrentBatchConfig$2.transition = prevTransition;
        }
      }
      return false;
    }
    function enqueuePendingPassiveProfilerEffect(fiber) {
      {
        pendingPassiveProfilerEffects.push(fiber);
        if (!rootDoesHavePassiveEffects) {
          rootDoesHavePassiveEffects = true;
          scheduleCallback$1(NormalPriority, function () {
            flushPassiveEffects();
            return null;
          });
        }
      }
    }
    function flushPassiveEffectsImpl() {
      if (rootWithPendingPassiveEffects === null) {
        return false;
      }
      var transitions = pendingPassiveTransitions;
      pendingPassiveTransitions = null;
      var root = rootWithPendingPassiveEffects;
      var lanes = pendingPassiveEffectsLanes;
      rootWithPendingPassiveEffects = null;
      pendingPassiveEffectsLanes = NoLanes;
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        throw new Error("Cannot flush passive effects while already rendering.");
      }
      {
        isFlushingPassiveEffects = true;
        didScheduleUpdateDuringPassiveEffects = false;
      }
      var prevExecutionContext = executionContext;
      executionContext |= CommitContext;
      commitPassiveUnmountEffects(root.current);
      commitPassiveMountEffects(root, root.current, lanes, transitions);
      {
        var profilerEffects = pendingPassiveProfilerEffects;
        pendingPassiveProfilerEffects = [];
        for (var i = 0; i < profilerEffects.length; i++) {
          var _fiber = profilerEffects[i];
          commitPassiveEffectDurations(root, _fiber);
        }
      }
      executionContext = prevExecutionContext;
      flushSyncCallbacks();
      {
        if (didScheduleUpdateDuringPassiveEffects) {
          if (root === rootWithPassiveNestedUpdates) {
            nestedPassiveUpdateCount++;
          } else {
            nestedPassiveUpdateCount = 0;
            rootWithPassiveNestedUpdates = root;
          }
        } else {
          nestedPassiveUpdateCount = 0;
        }
        isFlushingPassiveEffects = false;
        didScheduleUpdateDuringPassiveEffects = false;
      }
      onPostCommitRoot(root);
      {
        var stateNode = root.current.stateNode;
        stateNode.effectDuration = 0;
        stateNode.passiveEffectDuration = 0;
      }
      return true;
    }
    function isAlreadyFailedLegacyErrorBoundary(instance) {
      return legacyErrorBoundariesThatAlreadyFailed !== null && legacyErrorBoundariesThatAlreadyFailed.has(instance);
    }
    function markLegacyErrorBoundaryAsFailed(instance) {
      if (legacyErrorBoundariesThatAlreadyFailed === null) {
        legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
      } else {
        legacyErrorBoundariesThatAlreadyFailed.add(instance);
      }
    }
    function prepareToThrowUncaughtError(error) {
      if (!hasUncaughtError) {
        hasUncaughtError = true;
        firstUncaughtError = error;
      }
    }
    var onUncaughtError = prepareToThrowUncaughtError;
    function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
      var errorInfo = createCapturedValueAtFiber(error, sourceFiber);
      var update = createRootErrorUpdate(rootFiber, errorInfo, SyncLane);
      var root = enqueueUpdate(rootFiber, update, SyncLane);
      var eventTime = requestEventTime();
      if (root !== null) {
        markRootUpdated(root, SyncLane, eventTime);
        ensureRootIsScheduled(root, eventTime);
      }
    }
    function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error$1) {
      {
        reportUncaughtErrorInDEV(error$1);
        setIsRunningInsertionEffect(false);
      }
      if (sourceFiber.tag === HostRoot) {
        captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error$1);
        return;
      }
      var fiber = null;
      {
        fiber = sourceFiber.return;
      }
      while (fiber !== null) {
        if (fiber.tag === HostRoot) {
          captureCommitPhaseErrorOnRoot(fiber, sourceFiber, error$1);
          return;
        } else if (fiber.tag === ClassComponent) {
          var ctor = fiber.type;
          var instance = fiber.stateNode;
          if (typeof ctor.getDerivedStateFromError === "function" || typeof instance.componentDidCatch === "function" && !isAlreadyFailedLegacyErrorBoundary(instance)) {
            var errorInfo = createCapturedValueAtFiber(error$1, sourceFiber);
            var update = createClassErrorUpdate(fiber, errorInfo, SyncLane);
            var root = enqueueUpdate(fiber, update, SyncLane);
            var eventTime = requestEventTime();
            if (root !== null) {
              markRootUpdated(root, SyncLane, eventTime);
              ensureRootIsScheduled(root, eventTime);
            }
            return;
          }
        }
        fiber = fiber.return;
      }
      {
        error("Internal React error: Attempted to capture a commit phase error " + "inside a detached tree. This indicates a bug in React. Likely " + "causes include deleting the same fiber more than once, committing an " + "already-finished tree, or an inconsistent return pointer.\n\n" + "Error message:\n\n%s", error$1);
      }
    }
    function pingSuspendedRoot(root, wakeable, pingedLanes) {
      var pingCache = root.pingCache;
      if (pingCache !== null) {
        pingCache.delete(wakeable);
      }
      var eventTime = requestEventTime();
      markRootPinged(root, pingedLanes);
      warnIfSuspenseResolutionNotWrappedWithActDEV(root);
      if (workInProgressRoot === root && isSubsetOfLanes(workInProgressRootRenderLanes, pingedLanes)) {
        if (workInProgressRootExitStatus === RootSuspendedWithDelay || workInProgressRootExitStatus === RootSuspended && includesOnlyRetries(workInProgressRootRenderLanes) && now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS) {
          prepareFreshStack(root, NoLanes);
        } else {
          workInProgressRootPingedLanes = mergeLanes(workInProgressRootPingedLanes, pingedLanes);
        }
      }
      ensureRootIsScheduled(root, eventTime);
    }
    function retryTimedOutBoundary(boundaryFiber, retryLane) {
      if (retryLane === NoLane) {
        retryLane = requestRetryLane(boundaryFiber);
      }
      var eventTime = requestEventTime();
      var root = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
      if (root !== null) {
        markRootUpdated(root, retryLane, eventTime);
        ensureRootIsScheduled(root, eventTime);
      }
    }
    function retryDehydratedSuspenseBoundary(boundaryFiber) {
      var suspenseState = boundaryFiber.memoizedState;
      var retryLane = NoLane;
      if (suspenseState !== null) {
        retryLane = suspenseState.retryLane;
      }
      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function resolveRetryWakeable(boundaryFiber, wakeable) {
      var retryLane = NoLane;
      var retryCache;
      switch (boundaryFiber.tag) {
        case SuspenseComponent:
          retryCache = boundaryFiber.stateNode;
          var suspenseState = boundaryFiber.memoizedState;
          if (suspenseState !== null) {
            retryLane = suspenseState.retryLane;
          }
          break;
        case SuspenseListComponent:
          retryCache = boundaryFiber.stateNode;
          break;
        default:
          throw new Error("Pinged unknown suspense boundary type. " + "This is probably a bug in React.");
      }
      if (retryCache !== null) {
        retryCache.delete(wakeable);
      }
      retryTimedOutBoundary(boundaryFiber, retryLane);
    }
    function jnd(timeElapsed) {
      return timeElapsed < 120 ? 120 : timeElapsed < 480 ? 480 : timeElapsed < 1080 ? 1080 : timeElapsed < 1920 ? 1920 : timeElapsed < 3000 ? 3000 : timeElapsed < 4320 ? 4320 : ceil(timeElapsed / 1960) * 1960;
    }
    function checkForNestedUpdates() {
      if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
        nestedUpdateCount = 0;
        rootWithNestedUpdates = null;
        throw new Error("Maximum update depth exceeded. This can happen when a component " + "repeatedly calls setState inside componentWillUpdate or " + "componentDidUpdate. React limits the number of nested updates to " + "prevent infinite loops.");
      }
      {
        if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
          nestedPassiveUpdateCount = 0;
          rootWithPassiveNestedUpdates = null;
          error("Maximum update depth exceeded. This can happen when a component " + "calls setState inside useEffect, but useEffect either doesn't " + "have a dependency array, or one of the dependencies changes on " + "every render.");
        }
      }
    }
    function flushRenderPhaseStrictModeWarningsInDEV() {
      {
        ReactStrictModeWarnings.flushLegacyContextWarning();
        {
          ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();
        }
      }
    }
    var didWarnStateUpdateForNotYetMountedComponent = null;
    function warnAboutUpdateOnNotYetMountedFiberInDEV(fiber) {
      {
        if ((executionContext & RenderContext) !== NoContext) {
          return;
        }
        if (!(fiber.mode & ConcurrentMode)) {
          return;
        }
        var tag = fiber.tag;
        if (tag !== IndeterminateComponent && tag !== HostRoot && tag !== ClassComponent && tag !== FunctionComponent && tag !== ForwardRef && tag !== MemoComponent && tag !== SimpleMemoComponent) {
          return;
        }
        var componentName = getComponentNameFromFiber(fiber) || "ReactComponent";
        if (didWarnStateUpdateForNotYetMountedComponent !== null) {
          if (didWarnStateUpdateForNotYetMountedComponent.has(componentName)) {
            return;
          }
          didWarnStateUpdateForNotYetMountedComponent.add(componentName);
        } else {
          didWarnStateUpdateForNotYetMountedComponent = new Set([componentName]);
        }
        var previousFiber = current;
        try {
          setCurrentFiber(fiber);
          error("Can't perform a React state update on a component that hasn't mounted yet. " + "This indicates that you have a side-effect in your render function that " + "asynchronously later calls tries to update the component. Move this work to " + "useEffect instead.");
        } finally {
          if (previousFiber) {
            setCurrentFiber(fiber);
          } else {
            resetCurrentFiber();
          }
        }
      }
    }
    var beginWork$1;
    {
      var dummyFiber = null;
      beginWork$1 = function beginWork$1(current, unitOfWork, lanes) {
        var originalWorkInProgressCopy = assignFiberPropertiesInDEV(dummyFiber, unitOfWork);
        try {
          return beginWork(current, unitOfWork, lanes);
        } catch (originalError) {
          if (didSuspendOrErrorWhileHydratingDEV() || originalError !== null && typeof originalError === "object" && typeof originalError.then === "function") {
            throw originalError;
          }
          resetContextDependencies();
          resetHooksAfterThrow();
          unwindInterruptedWork(current, unitOfWork);
          assignFiberPropertiesInDEV(unitOfWork, originalWorkInProgressCopy);
          if (unitOfWork.mode & ProfileMode) {
            startProfilerTimer(unitOfWork);
          }
          invokeGuardedCallback(null, beginWork, null, current, unitOfWork, lanes);
          if (hasCaughtError()) {
            var replayError = clearCaughtError();
            if (typeof replayError === "object" && replayError !== null && replayError._suppressLogging && typeof originalError === "object" && originalError !== null && !originalError._suppressLogging) {
              originalError._suppressLogging = true;
            }
          }
          throw originalError;
        }
      };
    }
    var didWarnAboutUpdateInRender = false;
    var didWarnAboutUpdateInRenderForAnotherComponent;
    {
      didWarnAboutUpdateInRenderForAnotherComponent = new Set();
    }
    function warnAboutRenderPhaseUpdatesInDEV(fiber) {
      {
        if (isRendering && !getIsUpdatingOpaqueValueInRenderPhaseInDEV()) {
          switch (fiber.tag) {
            case FunctionComponent:
            case ForwardRef:
            case SimpleMemoComponent:
              {
                var renderingComponentName = workInProgress && getComponentNameFromFiber(workInProgress) || "Unknown";
                var dedupeKey = renderingComponentName;
                if (!didWarnAboutUpdateInRenderForAnotherComponent.has(dedupeKey)) {
                  didWarnAboutUpdateInRenderForAnotherComponent.add(dedupeKey);
                  var setStateComponentName = getComponentNameFromFiber(fiber) || "Unknown";
                  error("Cannot update a component (`%s`) while rendering a " + "different component (`%s`). To locate the bad setState() call inside `%s`, " + "follow the stack trace as described in https://reactjs.org/link/setstate-in-render", setStateComponentName, renderingComponentName, renderingComponentName);
                }
                break;
              }
            case ClassComponent:
              {
                if (!didWarnAboutUpdateInRender) {
                  error("Cannot update during an existing state transition (such as " + "within `render`). Render methods should be a pure " + "function of props and state.");
                  didWarnAboutUpdateInRender = true;
                }
                break;
              }
          }
        }
      }
    }
    function restorePendingUpdaters(root, lanes) {
      {
        if (isDevToolsPresent) {
          var memoizedUpdaters = root.memoizedUpdaters;
          memoizedUpdaters.forEach(function (schedulingFiber) {
            addFiberToLanesMap(root, schedulingFiber, lanes);
          });
        }
      }
    }
    var fakeActCallbackNode = {};
    function scheduleCallback$1(priorityLevel, callback) {
      {
        var actQueue = ReactCurrentActQueue$1.current;
        if (actQueue !== null) {
          actQueue.push(callback);
          return fakeActCallbackNode;
        } else {
          return scheduleCallback(priorityLevel, callback);
        }
      }
    }
    function cancelCallback$1(callbackNode) {
      if (callbackNode === fakeActCallbackNode) {
        return;
      }
      return cancelCallback(callbackNode);
    }
    function shouldForceFlushFallbacksInDEV() {
      return ReactCurrentActQueue$1.current !== null;
    }
    function warnIfUpdatesNotWrappedWithActDEV(fiber) {
      {
        if (fiber.mode & ConcurrentMode) {
          if (!isConcurrentActEnvironment()) {
            return;
          }
        } else {
          if (!isLegacyActEnvironment()) {
            return;
          }
          if (executionContext !== NoContext) {
            return;
          }
          if (fiber.tag !== FunctionComponent && fiber.tag !== ForwardRef && fiber.tag !== SimpleMemoComponent) {
            return;
          }
        }
        if (ReactCurrentActQueue$1.current === null) {
          var previousFiber = current;
          try {
            setCurrentFiber(fiber);
            error("An update to %s inside a test was not wrapped in act(...).\n\n" + "When testing, code that causes React state updates should be " + "wrapped into act(...):\n\n" + "act(() => {\n" + "  /* fire events that update state */\n" + "});\n" + "/* assert on the output */\n\n" + "This ensures that you're testing the behavior the user would see " + "in the browser." + " Learn more at https://reactjs.org/link/wrap-tests-with-act", getComponentNameFromFiber(fiber));
          } finally {
            if (previousFiber) {
              setCurrentFiber(fiber);
            } else {
              resetCurrentFiber();
            }
          }
        }
      }
    }
    function warnIfSuspenseResolutionNotWrappedWithActDEV(root) {
      {
        if (root.tag !== LegacyRoot && isConcurrentActEnvironment() && ReactCurrentActQueue$1.current === null) {
          error("A suspended resource finished loading inside a test, but the event " + "was not wrapped in act(...).\n\n" + "When testing, code that resolves suspended data should be wrapped " + "into act(...):\n\n" + "act(() => {\n" + "  /* finish loading suspended data */\n" + "});\n" + "/* assert on the output */\n\n" + "This ensures that you're testing the behavior the user would see " + "in the browser." + " Learn more at https://reactjs.org/link/wrap-tests-with-act");
        }
      }
    }
    function setIsRunningInsertionEffect(isRunning) {
      {
        isRunningInsertionEffect = isRunning;
      }
    }
    var resolveFamily = null;
    var failedBoundaries = null;
    var setRefreshHandler = function setRefreshHandler(handler) {
      {
        resolveFamily = handler;
      }
    };
    function resolveFunctionForHotReloading(type) {
      {
        if (resolveFamily === null) {
          return type;
        }
        var family = resolveFamily(type);
        if (family === undefined) {
          return type;
        }
        return family.current;
      }
    }
    function resolveClassForHotReloading(type) {
      return resolveFunctionForHotReloading(type);
    }
    function resolveForwardRefForHotReloading(type) {
      {
        if (resolveFamily === null) {
          return type;
        }
        var family = resolveFamily(type);
        if (family === undefined) {
          if (type !== null && type !== undefined && typeof type.render === "function") {
            var currentRender = resolveFunctionForHotReloading(type.render);
            if (type.render !== currentRender) {
              var syntheticType = {
                $$typeof: REACT_FORWARD_REF_TYPE,
                render: currentRender
              };
              if (type.displayName !== undefined) {
                syntheticType.displayName = type.displayName;
              }
              return syntheticType;
            }
          }
          return type;
        }
        return family.current;
      }
    }
    function isCompatibleFamilyForHotReloading(fiber, element) {
      {
        if (resolveFamily === null) {
          return false;
        }
        var prevType = fiber.elementType;
        var nextType = element.type;
        var needsCompareFamilies = false;
        var $$typeofNextType = typeof nextType === "object" && nextType !== null ? nextType.$$typeof : null;
        switch (fiber.tag) {
          case ClassComponent:
            {
              if (typeof nextType === "function") {
                needsCompareFamilies = true;
              }
              break;
            }
          case FunctionComponent:
            {
              if (typeof nextType === "function") {
                needsCompareFamilies = true;
              } else if ($$typeofNextType === REACT_LAZY_TYPE) {
                needsCompareFamilies = true;
              }
              break;
            }
          case ForwardRef:
            {
              if ($$typeofNextType === REACT_FORWARD_REF_TYPE) {
                needsCompareFamilies = true;
              } else if ($$typeofNextType === REACT_LAZY_TYPE) {
                needsCompareFamilies = true;
              }
              break;
            }
          case MemoComponent:
          case SimpleMemoComponent:
            {
              if ($$typeofNextType === REACT_MEMO_TYPE) {
                needsCompareFamilies = true;
              } else if ($$typeofNextType === REACT_LAZY_TYPE) {
                needsCompareFamilies = true;
              }
              break;
            }
          default:
            return false;
        }
        if (needsCompareFamilies) {
          var prevFamily = resolveFamily(prevType);
          if (prevFamily !== undefined && prevFamily === resolveFamily(nextType)) {
            return true;
          }
        }
        return false;
      }
    }
    function markFailedErrorBoundaryForHotReloading(fiber) {
      {
        if (resolveFamily === null) {
          return;
        }
        if (typeof WeakSet !== "function") {
          return;
        }
        if (failedBoundaries === null) {
          failedBoundaries = new WeakSet();
        }
        failedBoundaries.add(fiber);
      }
    }
    var scheduleRefresh = function scheduleRefresh(root, update) {
      {
        if (resolveFamily === null) {
          return;
        }
        var staleFamilies = update.staleFamilies,
          updatedFamilies = update.updatedFamilies;
        flushPassiveEffects();
        flushSync(function () {
          scheduleFibersWithFamiliesRecursively(root.current, updatedFamilies, staleFamilies);
        });
      }
    };
    var scheduleRoot = function scheduleRoot(root, element) {
      {
        if (root.context !== emptyContextObject) {
          return;
        }
        flushPassiveEffects();
        flushSync(function () {
          updateContainer(element, root, null, null);
        });
      }
    };
    function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {
      {
        var alternate = fiber.alternate,
          child = fiber.child,
          sibling = fiber.sibling,
          tag = fiber.tag,
          type = fiber.type;
        var candidateType = null;
        switch (tag) {
          case FunctionComponent:
          case SimpleMemoComponent:
          case ClassComponent:
            candidateType = type;
            break;
          case ForwardRef:
            candidateType = type.render;
            break;
        }
        if (resolveFamily === null) {
          throw new Error("Expected resolveFamily to be set during hot reload.");
        }
        var needsRender = false;
        var needsRemount = false;
        if (candidateType !== null) {
          var family = resolveFamily(candidateType);
          if (family !== undefined) {
            if (staleFamilies.has(family)) {
              needsRemount = true;
            } else if (updatedFamilies.has(family)) {
              if (tag === ClassComponent) {
                needsRemount = true;
              } else {
                needsRender = true;
              }
            }
          }
        }
        if (failedBoundaries !== null) {
          if (failedBoundaries.has(fiber) || alternate !== null && failedBoundaries.has(alternate)) {
            needsRemount = true;
          }
        }
        if (needsRemount) {
          fiber._debugNeedsRemount = true;
        }
        if (needsRemount || needsRender) {
          var _root = enqueueConcurrentRenderForLane(fiber, SyncLane);
          if (_root !== null) {
            scheduleUpdateOnFiber(_root, fiber, SyncLane, NoTimestamp);
          }
        }
        if (child !== null && !needsRemount) {
          scheduleFibersWithFamiliesRecursively(child, updatedFamilies, staleFamilies);
        }
        if (sibling !== null) {
          scheduleFibersWithFamiliesRecursively(sibling, updatedFamilies, staleFamilies);
        }
      }
    }
    var findHostInstancesForRefresh = function findHostInstancesForRefresh(root, families) {
      {
        var hostInstances = new Set();
        var types = new Set(families.map(function (family) {
          return family.current;
        }));
        findHostInstancesForMatchingFibersRecursively(root.current, types, hostInstances);
        return hostInstances;
      }
    };
    function findHostInstancesForMatchingFibersRecursively(fiber, types, hostInstances) {
      {
        var child = fiber.child,
          sibling = fiber.sibling,
          tag = fiber.tag,
          type = fiber.type;
        var candidateType = null;
        switch (tag) {
          case FunctionComponent:
          case SimpleMemoComponent:
          case ClassComponent:
            candidateType = type;
            break;
          case ForwardRef:
            candidateType = type.render;
            break;
        }
        var didMatch = false;
        if (candidateType !== null) {
          if (types.has(candidateType)) {
            didMatch = true;
          }
        }
        if (didMatch) {
          findHostInstancesForFiberShallowly(fiber, hostInstances);
        } else {
          if (child !== null) {
            findHostInstancesForMatchingFibersRecursively(child, types, hostInstances);
          }
        }
        if (sibling !== null) {
          findHostInstancesForMatchingFibersRecursively(sibling, types, hostInstances);
        }
      }
    }
    function findHostInstancesForFiberShallowly(fiber, hostInstances) {
      {
        var foundHostInstances = findChildHostInstancesForFiberShallowly(fiber, hostInstances);
        if (foundHostInstances) {
          return;
        }
        var node = fiber;
        while (true) {
          switch (node.tag) {
            case HostComponent:
              hostInstances.add(node.stateNode);
              return;
            case HostPortal:
              hostInstances.add(node.stateNode.containerInfo);
              return;
            case HostRoot:
              hostInstances.add(node.stateNode.containerInfo);
              return;
          }
          if (node.return === null) {
            throw new Error("Expected to reach root first.");
          }
          node = node.return;
        }
      }
    }
    function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
      {
        var node = fiber;
        var foundHostInstances = false;
        while (true) {
          if (node.tag === HostComponent) {
            foundHostInstances = true;
            hostInstances.add(node.stateNode);
          } else if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
          }
          if (node === fiber) {
            return foundHostInstances;
          }
          while (node.sibling === null) {
            if (node.return === null || node.return === fiber) {
              return foundHostInstances;
            }
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
      }
      return false;
    }
    var hasBadMapPolyfill;
    {
      hasBadMapPolyfill = false;
      try {
        var nonExtensibleObject = Object.preventExtensions({});
        new Map([[nonExtensibleObject, null]]);
        new Set([nonExtensibleObject]);
      } catch (e) {
        hasBadMapPolyfill = true;
      }
    }
    function FiberNode(tag, pendingProps, key, mode) {
      this.tag = tag;
      this.key = key;
      this.elementType = null;
      this.type = null;
      this.stateNode = null;
      this.return = null;
      this.child = null;
      this.sibling = null;
      this.index = 0;
      this.ref = null;
      this.pendingProps = pendingProps;
      this.memoizedProps = null;
      this.updateQueue = null;
      this.memoizedState = null;
      this.dependencies = null;
      this.mode = mode;
      this.flags = NoFlags;
      this.subtreeFlags = NoFlags;
      this.deletions = null;
      this.lanes = NoLanes;
      this.childLanes = NoLanes;
      this.alternate = null;
      {
        this.actualDuration = Number.NaN;
        this.actualStartTime = Number.NaN;
        this.selfBaseDuration = Number.NaN;
        this.treeBaseDuration = Number.NaN;
        this.actualDuration = 0;
        this.actualStartTime = -1;
        this.selfBaseDuration = 0;
        this.treeBaseDuration = 0;
      }
      {
        this._debugSource = null;
        this._debugOwner = null;
        this._debugNeedsRemount = false;
        this._debugHookTypes = null;
        if (!hasBadMapPolyfill && typeof Object.preventExtensions === "function") {
          Object.preventExtensions(this);
        }
      }
    }
    var createFiber = function createFiber(tag, pendingProps, key, mode) {
      return new FiberNode(tag, pendingProps, key, mode);
    };
    function shouldConstruct(Component) {
      var prototype = Component.prototype;
      return !!(prototype && prototype.isReactComponent);
    }
    function isSimpleFunctionComponent(type) {
      return typeof type === "function" && !shouldConstruct(type) && type.defaultProps === undefined;
    }
    function resolveLazyComponentTag(Component) {
      if (typeof Component === "function") {
        return shouldConstruct(Component) ? ClassComponent : FunctionComponent;
      } else if (Component !== undefined && Component !== null) {
        var $$typeof = Component.$$typeof;
        if ($$typeof === REACT_FORWARD_REF_TYPE) {
          return ForwardRef;
        }
        if ($$typeof === REACT_MEMO_TYPE) {
          return MemoComponent;
        }
      }
      return IndeterminateComponent;
    }
    function createWorkInProgress(current, pendingProps) {
      var workInProgress = current.alternate;
      if (workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        {
          workInProgress._debugSource = current._debugSource;
          workInProgress._debugOwner = current._debugOwner;
          workInProgress._debugHookTypes = current._debugHookTypes;
        }
        workInProgress.alternate = current;
        current.alternate = workInProgress;
      } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = NoFlags;
        workInProgress.subtreeFlags = NoFlags;
        workInProgress.deletions = null;
        {
          workInProgress.actualDuration = 0;
          workInProgress.actualStartTime = -1;
        }
      }
      workInProgress.flags = current.flags & StaticMask;
      workInProgress.childLanes = current.childLanes;
      workInProgress.lanes = current.lanes;
      workInProgress.child = current.child;
      workInProgress.memoizedProps = current.memoizedProps;
      workInProgress.memoizedState = current.memoizedState;
      workInProgress.updateQueue = current.updateQueue;
      var currentDependencies = current.dependencies;
      workInProgress.dependencies = currentDependencies === null ? null : {
        lanes: currentDependencies.lanes,
        firstContext: currentDependencies.firstContext
      };
      workInProgress.sibling = current.sibling;
      workInProgress.index = current.index;
      workInProgress.ref = current.ref;
      {
        workInProgress.selfBaseDuration = current.selfBaseDuration;
        workInProgress.treeBaseDuration = current.treeBaseDuration;
      }
      {
        workInProgress._debugNeedsRemount = current._debugNeedsRemount;
        switch (workInProgress.tag) {
          case IndeterminateComponent:
          case FunctionComponent:
          case SimpleMemoComponent:
            workInProgress.type = resolveFunctionForHotReloading(current.type);
            break;
          case ClassComponent:
            workInProgress.type = resolveClassForHotReloading(current.type);
            break;
          case ForwardRef:
            workInProgress.type = resolveForwardRefForHotReloading(current.type);
            break;
        }
      }
      return workInProgress;
    }
    function resetWorkInProgress(workInProgress, renderLanes) {
      workInProgress.flags &= StaticMask | Placement;
      var current = workInProgress.alternate;
      if (current === null) {
        workInProgress.childLanes = NoLanes;
        workInProgress.lanes = renderLanes;
        workInProgress.child = null;
        workInProgress.subtreeFlags = NoFlags;
        workInProgress.memoizedProps = null;
        workInProgress.memoizedState = null;
        workInProgress.updateQueue = null;
        workInProgress.dependencies = null;
        workInProgress.stateNode = null;
        {
          workInProgress.selfBaseDuration = 0;
          workInProgress.treeBaseDuration = 0;
        }
      } else {
        workInProgress.childLanes = current.childLanes;
        workInProgress.lanes = current.lanes;
        workInProgress.child = current.child;
        workInProgress.subtreeFlags = NoFlags;
        workInProgress.deletions = null;
        workInProgress.memoizedProps = current.memoizedProps;
        workInProgress.memoizedState = current.memoizedState;
        workInProgress.updateQueue = current.updateQueue;
        workInProgress.type = current.type;
        var currentDependencies = current.dependencies;
        workInProgress.dependencies = currentDependencies === null ? null : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext
        };
        {
          workInProgress.selfBaseDuration = current.selfBaseDuration;
          workInProgress.treeBaseDuration = current.treeBaseDuration;
        }
      }
      return workInProgress;
    }
    function createHostRootFiber(tag, isStrictMode, concurrentUpdatesByDefaultOverride) {
      var mode;
      if (tag === ConcurrentRoot) {
        mode = ConcurrentMode;
        if (isStrictMode === true) {
          mode |= StrictLegacyMode;
        }
      } else {
        mode = NoMode;
      }
      if (isDevToolsPresent) {
        mode |= ProfileMode;
      }
      return createFiber(HostRoot, null, null, mode);
    }
    function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
      var fiberTag = IndeterminateComponent;
      var resolvedType = type;
      if (typeof type === "function") {
        if (shouldConstruct(type)) {
          fiberTag = ClassComponent;
          {
            resolvedType = resolveClassForHotReloading(resolvedType);
          }
        } else {
          {
            resolvedType = resolveFunctionForHotReloading(resolvedType);
          }
        }
      } else if (typeof type === "string") {
        fiberTag = HostComponent;
      } else {
        getTag: switch (type) {
          case REACT_FRAGMENT_TYPE:
            return createFiberFromFragment(pendingProps.children, mode, lanes, key);
          case REACT_STRICT_MODE_TYPE:
            fiberTag = Mode;
            mode |= StrictLegacyMode;
            break;
          case REACT_PROFILER_TYPE:
            return createFiberFromProfiler(pendingProps, mode, lanes, key);
          case REACT_SUSPENSE_TYPE:
            return createFiberFromSuspense(pendingProps, mode, lanes, key);
          case REACT_SUSPENSE_LIST_TYPE:
            return createFiberFromSuspenseList(pendingProps, mode, lanes, key);
          case REACT_OFFSCREEN_TYPE:
            return createFiberFromOffscreen(pendingProps, mode, lanes, key);
          case REACT_LEGACY_HIDDEN_TYPE:
          case REACT_SCOPE_TYPE:
          case REACT_CACHE_TYPE:
          case REACT_TRACING_MARKER_TYPE:
          case REACT_DEBUG_TRACING_MODE_TYPE:
          default:
            {
              if (typeof type === "object" && type !== null) {
                switch (type.$$typeof) {
                  case REACT_PROVIDER_TYPE:
                    fiberTag = ContextProvider;
                    break getTag;
                  case REACT_CONTEXT_TYPE:
                    fiberTag = ContextConsumer;
                    break getTag;
                  case REACT_FORWARD_REF_TYPE:
                    fiberTag = ForwardRef;
                    {
                      resolvedType = resolveForwardRefForHotReloading(resolvedType);
                    }
                    break getTag;
                  case REACT_MEMO_TYPE:
                    fiberTag = MemoComponent;
                    break getTag;
                  case REACT_LAZY_TYPE:
                    fiberTag = LazyComponent;
                    resolvedType = null;
                    break getTag;
                }
              }
              var info = "";
              {
                if (type === undefined || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                  info += " You likely forgot to export your component from the file " + "it's defined in, or you might have mixed up default and " + "named imports.";
                }
                var ownerName = owner ? getComponentNameFromFiber(owner) : null;
                if (ownerName) {
                  info += "\n\nCheck the render method of `" + ownerName + "`.";
                }
              }
              throw new Error("Element type is invalid: expected a string (for built-in " + "components) or a class/function (for composite components) " + ("but got: " + (type == null ? type : typeof type) + "." + info));
            }
        }
      }
      var fiber = createFiber(fiberTag, pendingProps, key, mode);
      fiber.elementType = type;
      fiber.type = resolvedType;
      fiber.lanes = lanes;
      {
        fiber._debugOwner = owner;
      }
      return fiber;
    }
    function createFiberFromElement(element, mode, lanes) {
      var owner = null;
      {
        owner = element._owner;
      }
      var type = element.type;
      var key = element.key;
      var pendingProps = element.props;
      var fiber = createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes);
      {
        fiber._debugSource = element._source;
        fiber._debugOwner = element._owner;
      }
      return fiber;
    }
    function createFiberFromFragment(elements, mode, lanes, key) {
      var fiber = createFiber(Fragment, elements, key, mode);
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromProfiler(pendingProps, mode, lanes, key) {
      {
        if (typeof pendingProps.id !== "string") {
          error('Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.', typeof pendingProps.id);
        }
      }
      var fiber = createFiber(Profiler, pendingProps, key, mode | ProfileMode);
      fiber.elementType = REACT_PROFILER_TYPE;
      fiber.lanes = lanes;
      {
        fiber.stateNode = {
          effectDuration: 0,
          passiveEffectDuration: 0
        };
      }
      return fiber;
    }
    function createFiberFromSuspense(pendingProps, mode, lanes, key) {
      var fiber = createFiber(SuspenseComponent, pendingProps, key, mode);
      fiber.elementType = REACT_SUSPENSE_TYPE;
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromSuspenseList(pendingProps, mode, lanes, key) {
      var fiber = createFiber(SuspenseListComponent, pendingProps, key, mode);
      fiber.elementType = REACT_SUSPENSE_LIST_TYPE;
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromOffscreen(pendingProps, mode, lanes, key) {
      var fiber = createFiber(OffscreenComponent, pendingProps, key, mode);
      fiber.elementType = REACT_OFFSCREEN_TYPE;
      fiber.lanes = lanes;
      var primaryChildInstance = {
        isHidden: false
      };
      fiber.stateNode = primaryChildInstance;
      return fiber;
    }
    function createFiberFromText(content, mode, lanes) {
      var fiber = createFiber(HostText, content, null, mode);
      fiber.lanes = lanes;
      return fiber;
    }
    function createFiberFromPortal(portal, mode, lanes) {
      var pendingProps = portal.children !== null ? portal.children : [];
      var fiber = createFiber(HostPortal, pendingProps, portal.key, mode);
      fiber.lanes = lanes;
      fiber.stateNode = {
        containerInfo: portal.containerInfo,
        pendingChildren: null,
        implementation: portal.implementation
      };
      return fiber;
    }
    function assignFiberPropertiesInDEV(target, source) {
      if (target === null) {
        target = createFiber(IndeterminateComponent, null, null, NoMode);
      }
      target.tag = source.tag;
      target.key = source.key;
      target.elementType = source.elementType;
      target.type = source.type;
      target.stateNode = source.stateNode;
      target.return = source.return;
      target.child = source.child;
      target.sibling = source.sibling;
      target.index = source.index;
      target.ref = source.ref;
      target.pendingProps = source.pendingProps;
      target.memoizedProps = source.memoizedProps;
      target.updateQueue = source.updateQueue;
      target.memoizedState = source.memoizedState;
      target.dependencies = source.dependencies;
      target.mode = source.mode;
      target.flags = source.flags;
      target.subtreeFlags = source.subtreeFlags;
      target.deletions = source.deletions;
      target.lanes = source.lanes;
      target.childLanes = source.childLanes;
      target.alternate = source.alternate;
      {
        target.actualDuration = source.actualDuration;
        target.actualStartTime = source.actualStartTime;
        target.selfBaseDuration = source.selfBaseDuration;
        target.treeBaseDuration = source.treeBaseDuration;
      }
      target._debugSource = source._debugSource;
      target._debugOwner = source._debugOwner;
      target._debugNeedsRemount = source._debugNeedsRemount;
      target._debugHookTypes = source._debugHookTypes;
      return target;
    }
    function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onRecoverableError) {
      this.tag = tag;
      this.containerInfo = containerInfo;
      this.pendingChildren = null;
      this.current = null;
      this.pingCache = null;
      this.finishedWork = null;
      this.timeoutHandle = noTimeout;
      this.context = null;
      this.pendingContext = null;
      this.callbackNode = null;
      this.callbackPriority = NoLane;
      this.eventTimes = createLaneMap(NoLanes);
      this.expirationTimes = createLaneMap(NoTimestamp);
      this.pendingLanes = NoLanes;
      this.suspendedLanes = NoLanes;
      this.pingedLanes = NoLanes;
      this.expiredLanes = NoLanes;
      this.mutableReadLanes = NoLanes;
      this.finishedLanes = NoLanes;
      this.entangledLanes = NoLanes;
      this.entanglements = createLaneMap(NoLanes);
      this.identifierPrefix = identifierPrefix;
      this.onRecoverableError = onRecoverableError;
      {
        this.effectDuration = 0;
        this.passiveEffectDuration = 0;
      }
      {
        this.memoizedUpdaters = new Set();
        var pendingUpdatersLaneMap = this.pendingUpdatersLaneMap = [];
        for (var _i = 0; _i < TotalLanes; _i++) {
          pendingUpdatersLaneMap.push(new Set());
        }
      }
      {
        switch (tag) {
          case ConcurrentRoot:
            this._debugRootType = hydrate ? "hydrateRoot()" : "createRoot()";
            break;
          case LegacyRoot:
            this._debugRootType = hydrate ? "hydrate()" : "render()";
            break;
        }
      }
    }
    function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
      var root = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onRecoverableError);
      var uninitializedFiber = createHostRootFiber(tag, isStrictMode);
      root.current = uninitializedFiber;
      uninitializedFiber.stateNode = root;
      {
        var _initialState = {
          element: initialChildren,
          isDehydrated: hydrate,
          cache: null,
          transitions: null,
          pendingSuspenseBoundaries: null
        };
        uninitializedFiber.memoizedState = _initialState;
      }
      initializeUpdateQueue(uninitializedFiber);
      return root;
    }
    var ReactVersion = "18.2.0-next-9e3b772b8-20220608";
    function createPortal(children, containerInfo, implementation) {
      var key = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      {
        checkKeyStringCoercion(key);
      }
      return {
        $$typeof: REACT_PORTAL_TYPE,
        key: key == null ? null : "" + key,
        children: children,
        containerInfo: containerInfo,
        implementation: implementation
      };
    }
    var didWarnAboutNestedUpdates;
    var didWarnAboutFindNodeInStrictMode;
    {
      didWarnAboutNestedUpdates = false;
      didWarnAboutFindNodeInStrictMode = {};
    }
    function getContextForSubtree(parentComponent) {
      if (!parentComponent) {
        return emptyContextObject;
      }
      var fiber = get(parentComponent);
      var parentContext = findCurrentUnmaskedContext(fiber);
      if (fiber.tag === ClassComponent) {
        var Component = fiber.type;
        if (isContextProvider(Component)) {
          return processChildContext(fiber, Component, parentContext);
        }
      }
      return parentContext;
    }
    function findHostInstanceWithWarning(component, methodName) {
      {
        var fiber = get(component);
        if (fiber === undefined) {
          if (typeof component.render === "function") {
            throw new Error("Unable to find node on an unmounted component.");
          } else {
            var keys = Object.keys(component).join(",");
            throw new Error("Argument appears to not be a ReactComponent. Keys: " + keys);
          }
        }
        var hostFiber = findCurrentHostFiber(fiber);
        if (hostFiber === null) {
          return null;
        }
        if (hostFiber.mode & StrictLegacyMode) {
          var componentName = getComponentNameFromFiber(fiber) || "Component";
          if (!didWarnAboutFindNodeInStrictMode[componentName]) {
            didWarnAboutFindNodeInStrictMode[componentName] = true;
            var previousFiber = current;
            try {
              setCurrentFiber(hostFiber);
              if (fiber.mode & StrictLegacyMode) {
                error("%s is deprecated in StrictMode. " + "%s was passed an instance of %s which is inside StrictMode. " + "Instead, add a ref directly to the element you want to reference. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-find-node", methodName, methodName, componentName);
              } else {
                error("%s is deprecated in StrictMode. " + "%s was passed an instance of %s which renders StrictMode children. " + "Instead, add a ref directly to the element you want to reference. " + "Learn more about using refs safely here: " + "https://reactjs.org/link/strict-mode-find-node", methodName, methodName, componentName);
              }
            } finally {
              if (previousFiber) {
                setCurrentFiber(previousFiber);
              } else {
                resetCurrentFiber();
              }
            }
          }
        }
        return hostFiber.stateNode;
      }
    }
    function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
      var hydrate = false;
      var initialChildren = null;
      return createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError);
    }
    function updateContainer(element, container, parentComponent, callback) {
      {
        onScheduleRoot(container, element);
      }
      var current$1 = container.current;
      var eventTime = requestEventTime();
      var lane = requestUpdateLane(current$1);
      var context = getContextForSubtree(parentComponent);
      if (container.context === null) {
        container.context = context;
      } else {
        container.pendingContext = context;
      }
      {
        if (isRendering && current !== null && !didWarnAboutNestedUpdates) {
          didWarnAboutNestedUpdates = true;
          error("Render methods should be a pure function of props and state; " + "triggering nested component updates from render is not allowed. " + "If necessary, trigger nested updates in componentDidUpdate.\n\n" + "Check the render method of %s.", getComponentNameFromFiber(current) || "Unknown");
        }
      }
      var update = createUpdate(eventTime, lane);
      update.payload = {
        element: element
      };
      callback = callback === undefined ? null : callback;
      if (callback !== null) {
        {
          if (typeof callback !== "function") {
            error("render(...): Expected the last optional `callback` argument to be a " + "function. Instead received: %s.", callback);
          }
        }
        update.callback = callback;
      }
      var root = enqueueUpdate(current$1, update, lane);
      if (root !== null) {
        scheduleUpdateOnFiber(root, current$1, lane, eventTime);
        entangleTransitions(root, current$1, lane);
      }
      return lane;
    }
    function getPublicRootInstance(container) {
      var containerFiber = container.current;
      if (!containerFiber.child) {
        return null;
      }
      switch (containerFiber.child.tag) {
        case HostComponent:
          return getPublicInstance(containerFiber.child.stateNode);
        default:
          return containerFiber.child.stateNode;
      }
    }
    var shouldErrorImpl = function shouldErrorImpl(fiber) {
      return null;
    };
    function shouldError(fiber) {
      return shouldErrorImpl(fiber);
    }
    var shouldSuspendImpl = function shouldSuspendImpl(fiber) {
      return false;
    };
    function shouldSuspend(fiber) {
      return shouldSuspendImpl(fiber);
    }
    var overrideHookState = null;
    var overrideHookStateDeletePath = null;
    var overrideHookStateRenamePath = null;
    var overrideProps = null;
    var overridePropsDeletePath = null;
    var overridePropsRenamePath = null;
    var scheduleUpdate = null;
    var setErrorHandler = null;
    var setSuspenseHandler = null;
    {
      var copyWithDeleteImpl = function copyWithDeleteImpl(obj, path, index) {
        var key = path[index];
        var updated = isArray(obj) ? obj.slice() : assign({}, obj);
        if (index + 1 === path.length) {
          if (isArray(updated)) {
            updated.splice(key, 1);
          } else {
            delete updated[key];
          }
          return updated;
        }
        updated[key] = copyWithDeleteImpl(obj[key], path, index + 1);
        return updated;
      };
      var copyWithDelete = function copyWithDelete(obj, path) {
        return copyWithDeleteImpl(obj, path, 0);
      };
      var copyWithRenameImpl = function copyWithRenameImpl(obj, oldPath, newPath, index) {
        var oldKey = oldPath[index];
        var updated = isArray(obj) ? obj.slice() : assign({}, obj);
        if (index + 1 === oldPath.length) {
          var newKey = newPath[index];
          updated[newKey] = updated[oldKey];
          if (isArray(updated)) {
            updated.splice(oldKey, 1);
          } else {
            delete updated[oldKey];
          }
        } else {
          updated[oldKey] = copyWithRenameImpl(obj[oldKey], oldPath, newPath, index + 1);
        }
        return updated;
      };
      var copyWithRename = function copyWithRename(obj, oldPath, newPath) {
        if (oldPath.length !== newPath.length) {
          warn("copyWithRename() expects paths of the same length");
          return;
        } else {
          for (var i = 0; i < newPath.length - 1; i++) {
            if (oldPath[i] !== newPath[i]) {
              warn("copyWithRename() expects paths to be the same except for the deepest key");
              return;
            }
          }
        }
        return copyWithRenameImpl(obj, oldPath, newPath, 0);
      };
      var copyWithSetImpl = function copyWithSetImpl(obj, path, index, value) {
        if (index >= path.length) {
          return value;
        }
        var key = path[index];
        var updated = isArray(obj) ? obj.slice() : assign({}, obj);
        updated[key] = copyWithSetImpl(obj[key], path, index + 1, value);
        return updated;
      };
      var copyWithSet = function copyWithSet(obj, path, value) {
        return copyWithSetImpl(obj, path, 0, value);
      };
      var findHook = function findHook(fiber, id) {
        var currentHook = fiber.memoizedState;
        while (currentHook !== null && id > 0) {
          currentHook = currentHook.next;
          id--;
        }
        return currentHook;
      };
      overrideHookState = function overrideHookState(fiber, id, path, value) {
        var hook = findHook(fiber, id);
        if (hook !== null) {
          var newState = copyWithSet(hook.memoizedState, path, value);
          hook.memoizedState = newState;
          hook.baseState = newState;
          fiber.memoizedProps = assign({}, fiber.memoizedProps);
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
          }
        }
      };
      overrideHookStateDeletePath = function overrideHookStateDeletePath(fiber, id, path) {
        var hook = findHook(fiber, id);
        if (hook !== null) {
          var newState = copyWithDelete(hook.memoizedState, path);
          hook.memoizedState = newState;
          hook.baseState = newState;
          fiber.memoizedProps = assign({}, fiber.memoizedProps);
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
          }
        }
      };
      overrideHookStateRenamePath = function overrideHookStateRenamePath(fiber, id, oldPath, newPath) {
        var hook = findHook(fiber, id);
        if (hook !== null) {
          var newState = copyWithRename(hook.memoizedState, oldPath, newPath);
          hook.memoizedState = newState;
          hook.baseState = newState;
          fiber.memoizedProps = assign({}, fiber.memoizedProps);
          var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
          if (root !== null) {
            scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
          }
        }
      };
      overrideProps = function overrideProps(fiber, path, value) {
        fiber.pendingProps = copyWithSet(fiber.memoizedProps, path, value);
        if (fiber.alternate) {
          fiber.alternate.pendingProps = fiber.pendingProps;
        }
        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
        }
      };
      overridePropsDeletePath = function overridePropsDeletePath(fiber, path) {
        fiber.pendingProps = copyWithDelete(fiber.memoizedProps, path);
        if (fiber.alternate) {
          fiber.alternate.pendingProps = fiber.pendingProps;
        }
        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
        }
      };
      overridePropsRenamePath = function overridePropsRenamePath(fiber, oldPath, newPath) {
        fiber.pendingProps = copyWithRename(fiber.memoizedProps, oldPath, newPath);
        if (fiber.alternate) {
          fiber.alternate.pendingProps = fiber.pendingProps;
        }
        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
        }
      };
      scheduleUpdate = function scheduleUpdate(fiber) {
        var root = enqueueConcurrentRenderForLane(fiber, SyncLane);
        if (root !== null) {
          scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
        }
      };
      setErrorHandler = function setErrorHandler(newShouldErrorImpl) {
        shouldErrorImpl = newShouldErrorImpl;
      };
      setSuspenseHandler = function setSuspenseHandler(newShouldSuspendImpl) {
        shouldSuspendImpl = newShouldSuspendImpl;
      };
    }
    function findHostInstanceByFiber(fiber) {
      var hostFiber = findCurrentHostFiber(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    }
    function emptyFindFiberByHostInstance(instance) {
      return null;
    }
    function getCurrentFiberForDevTools() {
      return current;
    }
    function injectIntoDevTools(devToolsConfig) {
      var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
      var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
      return injectInternals({
        bundleType: devToolsConfig.bundleType,
        version: devToolsConfig.version,
        rendererPackageName: devToolsConfig.rendererPackageName,
        rendererConfig: devToolsConfig.rendererConfig,
        overrideHookState: overrideHookState,
        overrideHookStateDeletePath: overrideHookStateDeletePath,
        overrideHookStateRenamePath: overrideHookStateRenamePath,
        overrideProps: overrideProps,
        overridePropsDeletePath: overridePropsDeletePath,
        overridePropsRenamePath: overridePropsRenamePath,
        setErrorHandler: setErrorHandler,
        setSuspenseHandler: setSuspenseHandler,
        scheduleUpdate: scheduleUpdate,
        currentDispatcherRef: ReactCurrentDispatcher,
        findHostInstanceByFiber: findHostInstanceByFiber,
        findFiberByHostInstance: findFiberByHostInstance || emptyFindFiberByHostInstance,
        findHostInstancesForRefresh: findHostInstancesForRefresh,
        scheduleRefresh: scheduleRefresh,
        scheduleRoot: scheduleRoot,
        setRefreshHandler: setRefreshHandler,
        getCurrentFiber: getCurrentFiberForDevTools,
        reconcilerVersion: ReactVersion
      });
    }
    var emptyObject$1 = {};
    {
      Object.freeze(emptyObject$1);
    }
    var createHierarchy;
    var getHostNode;
    var getHostProps;
    var lastNonHostInstance;
    var getOwnerHierarchy;
    var _traverseOwnerTreeUp;
    {
      createHierarchy = function createHierarchy(fiberHierarchy) {
        return fiberHierarchy.map(function (fiber) {
          return {
            name: getComponentNameFromType(fiber.type),
            getInspectorData: function getInspectorData(findNodeHandle) {
              return {
                props: getHostProps(fiber),
                source: fiber._debugSource,
                measure: function measure(callback) {
                  var hostFiber = findCurrentHostFiber(fiber);
                  var shadowNode = hostFiber != null && hostFiber.stateNode !== null && hostFiber.stateNode.node;
                  if (shadowNode) {
                    nativeFabricUIManager.measure(shadowNode, callback);
                  } else {
                    return ReactNativePrivateInterface.UIManager.measure(getHostNode(fiber, findNodeHandle), callback);
                  }
                }
              };
            }
          };
        });
      };
      getHostNode = function getHostNode(fiber, findNodeHandle) {
        var hostNode;
        while (fiber) {
          if (fiber.stateNode !== null && fiber.tag === HostComponent) {
            hostNode = findNodeHandle(fiber.stateNode);
          }
          if (hostNode) {
            return hostNode;
          }
          fiber = fiber.child;
        }
        return null;
      };
      getHostProps = function getHostProps(fiber) {
        var host = findCurrentHostFiber(fiber);
        if (host) {
          return host.memoizedProps || emptyObject$1;
        }
        return emptyObject$1;
      };
      exports.getInspectorDataForInstance = function (closestInstance) {
        if (!closestInstance) {
          return {
            hierarchy: [],
            props: emptyObject$1,
            selectedIndex: null,
            source: null
          };
        }
        var fiber = findCurrentFiberUsingSlowPath(closestInstance);
        var fiberHierarchy = getOwnerHierarchy(fiber);
        var instance = lastNonHostInstance(fiberHierarchy);
        var hierarchy = createHierarchy(fiberHierarchy);
        var props = getHostProps(instance);
        var source = instance._debugSource;
        var selectedIndex = fiberHierarchy.indexOf(instance);
        return {
          hierarchy: hierarchy,
          props: props,
          selectedIndex: selectedIndex,
          source: source
        };
      };
      getOwnerHierarchy = function getOwnerHierarchy(instance) {
        var hierarchy = [];
        _traverseOwnerTreeUp(hierarchy, instance);
        return hierarchy;
      };
      lastNonHostInstance = function lastNonHostInstance(hierarchy) {
        for (var i = hierarchy.length - 1; i > 1; i--) {
          var instance = hierarchy[i];
          if (instance.tag !== HostComponent) {
            return instance;
          }
        }
        return hierarchy[0];
      };
      _traverseOwnerTreeUp = function traverseOwnerTreeUp(hierarchy, instance) {
        if (instance) {
          hierarchy.unshift(instance);
          _traverseOwnerTreeUp(hierarchy, instance._debugOwner);
        }
      };
    }
    var getInspectorDataForViewTag;
    var getInspectorDataForViewAtPoint;
    {
      getInspectorDataForViewTag = function getInspectorDataForViewTag(viewTag) {
        var closestInstance = getInstanceFromTag(viewTag);
        if (!closestInstance) {
          return {
            hierarchy: [],
            props: emptyObject$1,
            selectedIndex: null,
            source: null
          };
        }
        var fiber = findCurrentFiberUsingSlowPath(closestInstance);
        var fiberHierarchy = getOwnerHierarchy(fiber);
        var instance = lastNonHostInstance(fiberHierarchy);
        var hierarchy = createHierarchy(fiberHierarchy);
        var props = getHostProps(instance);
        var source = instance._debugSource;
        var selectedIndex = fiberHierarchy.indexOf(instance);
        return {
          hierarchy: hierarchy,
          props: props,
          selectedIndex: selectedIndex,
          source: source
        };
      };
      getInspectorDataForViewAtPoint = function getInspectorDataForViewAtPoint(findNodeHandle, inspectedView, locationX, locationY, callback) {
        var closestInstance = null;
        if (inspectedView._internalInstanceHandle != null) {
          nativeFabricUIManager.findNodeAtPoint(inspectedView._internalInstanceHandle.stateNode.node, locationX, locationY, function (internalInstanceHandle) {
            if (internalInstanceHandle == null) {
              callback(assign({
                pointerY: locationY,
                frame: {
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0
                }
              }, exports.getInspectorDataForInstance(closestInstance)));
            }
            closestInstance = internalInstanceHandle.stateNode.canonical._internalInstanceHandle;
            var nativeViewTag = internalInstanceHandle.stateNode.canonical._nativeTag;
            nativeFabricUIManager.measure(internalInstanceHandle.stateNode.node, function (x, y, width, height, pageX, pageY) {
              var inspectorData = exports.getInspectorDataForInstance(closestInstance);
              callback(assign({}, inspectorData, {
                pointerY: locationY,
                frame: {
                  left: pageX,
                  top: pageY,
                  width: width,
                  height: height
                },
                touchedViewTag: nativeViewTag
              }));
            });
          });
        } else if (inspectedView._internalFiberInstanceHandleDEV != null) {
          ReactNativePrivateInterface.UIManager.findSubviewIn(findNodeHandle(inspectedView), [locationX, locationY], function (nativeViewTag, left, top, width, height) {
            var inspectorData = exports.getInspectorDataForInstance(getInstanceFromTag(nativeViewTag));
            callback(assign({}, inspectorData, {
              pointerY: locationY,
              frame: {
                left: left,
                top: top,
                width: width,
                height: height
              },
              touchedViewTag: nativeViewTag
            }));
          });
        } else {
          error("getInspectorDataForViewAtPoint expects to receive a host component");
          return;
        }
      };
    }
    var ReactCurrentOwner$3 = ReactSharedInternals.ReactCurrentOwner;
    function findHostInstance_DEPRECATED(componentOrHandle) {
      {
        var owner = ReactCurrentOwner$3.current;
        if (owner !== null && owner.stateNode !== null) {
          if (!owner.stateNode._warnedAboutRefsInRender) {
            error("%s is accessing findNodeHandle inside its render(). " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", getComponentNameFromType(owner.type) || "A component");
          }
          owner.stateNode._warnedAboutRefsInRender = true;
        }
      }
      if (componentOrHandle == null) {
        return null;
      }
      if (componentOrHandle._nativeTag) {
        return componentOrHandle;
      }
      if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
        return componentOrHandle.canonical;
      }
      var hostInstance;
      {
        hostInstance = findHostInstanceWithWarning(componentOrHandle, "findHostInstance_DEPRECATED");
      }
      if (hostInstance == null) {
        return hostInstance;
      }
      if (hostInstance.canonical) {
        return hostInstance.canonical;
      }
      return hostInstance;
    }
    function findNodeHandle(componentOrHandle) {
      {
        var owner = ReactCurrentOwner$3.current;
        if (owner !== null && owner.stateNode !== null) {
          if (!owner.stateNode._warnedAboutRefsInRender) {
            error("%s is accessing findNodeHandle inside its render(). " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", getComponentNameFromType(owner.type) || "A component");
          }
          owner.stateNode._warnedAboutRefsInRender = true;
        }
      }
      if (componentOrHandle == null) {
        return null;
      }
      if (typeof componentOrHandle === "number") {
        return componentOrHandle;
      }
      if (componentOrHandle._nativeTag) {
        return componentOrHandle._nativeTag;
      }
      if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
        return componentOrHandle.canonical._nativeTag;
      }
      var hostInstance;
      {
        hostInstance = findHostInstanceWithWarning(componentOrHandle, "findNodeHandle");
      }
      if (hostInstance == null) {
        return hostInstance;
      }
      if (hostInstance.canonical) {
        return hostInstance.canonical._nativeTag;
      }
      return hostInstance._nativeTag;
    }
    function dispatchCommand(handle, command, args) {
      if (handle._nativeTag == null) {
        {
          error("dispatchCommand was called with a ref that isn't a " + "native component. Use React.forwardRef to get access to the underlying native component");
        }
        return;
      }
      if (handle._internalInstanceHandle != null) {
        var stateNode = handle._internalInstanceHandle.stateNode;
        if (stateNode != null) {
          nativeFabricUIManager.dispatchCommand(stateNode.node, command, args);
        }
      } else {
        ReactNativePrivateInterface.UIManager.dispatchViewManagerCommand(handle._nativeTag, command, args);
      }
    }
    function sendAccessibilityEvent(handle, eventType) {
      if (handle._nativeTag == null) {
        {
          error("sendAccessibilityEvent was called with a ref that isn't a " + "native component. Use React.forwardRef to get access to the underlying native component");
        }
        return;
      }
      if (handle._internalInstanceHandle != null) {
        var stateNode = handle._internalInstanceHandle.stateNode;
        if (stateNode != null) {
          nativeFabricUIManager.sendAccessibilityEvent(stateNode.node, eventType);
        }
      } else {
        ReactNativePrivateInterface.legacySendAccessibilityEvent(handle._nativeTag, eventType);
      }
    }
    function onRecoverableError(error$1) {
      error(error$1);
    }
    function render(element, containerTag, callback) {
      var root = roots.get(containerTag);
      if (!root) {
        root = createContainer(containerTag, LegacyRoot, null, false, null, "", onRecoverableError);
        roots.set(containerTag, root);
      }
      updateContainer(element, root, null, callback);
      return getPublicRootInstance(root);
    }
    function unmountComponentAtNode(containerTag) {
      var root = roots.get(containerTag);
      if (root) {
        updateContainer(null, root, null, function () {
          roots.delete(containerTag);
        });
      }
    }
    function unmountComponentAtNodeAndRemoveContainer(containerTag) {
      unmountComponentAtNode(containerTag);
      ReactNativePrivateInterface.UIManager.removeRootView(containerTag);
    }
    function createPortal$1(children, containerTag) {
      var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      return createPortal(children, containerTag, null, key);
    }
    setBatchingImplementation(batchedUpdates$1);
    function computeComponentStackForErrorReporting(reactTag) {
      var fiber = getInstanceFromTag(reactTag);
      if (!fiber) {
        return "";
      }
      return getStackByFiberInDevAndProd(fiber);
    }
    var roots = new Map();
    var Internals = {
      computeComponentStackForErrorReporting: computeComponentStackForErrorReporting
    };
    injectIntoDevTools({
      findFiberByHostInstance: getInstanceFromTag,
      bundleType: 1,
      version: ReactVersion,
      rendererPackageName: "react-native-renderer",
      rendererConfig: {
        getInspectorDataForViewTag: getInspectorDataForViewTag,
        getInspectorDataForViewAtPoint: getInspectorDataForViewAtPoint.bind(null, findNodeHandle)
      }
    });
    exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Internals;
    exports.createPortal = createPortal$1;
    exports.dispatchCommand = dispatchCommand;
    exports.findHostInstance_DEPRECATED = findHostInstance_DEPRECATED;
    exports.findNodeHandle = findNodeHandle;
    exports.render = render;
    exports.sendAccessibilityEvent = sendAccessibilityEvent;
    exports.unmountComponentAtNode = unmountComponentAtNode;
    exports.unmountComponentAtNodeAndRemoveContainer = unmountComponentAtNodeAndRemoveContainer;
    exports.unstable_batchedUpdates = batchedUpdates;
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === 'function') {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }
  })();
}