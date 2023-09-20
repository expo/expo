var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PerformanceObserverEntryList = void 0;
exports.warnNoNativePerformanceObserver = warnNoNativePerformanceObserver;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _warnOnce = _interopRequireDefault(require("../Utilities/warnOnce"));
var _NativePerformanceObserver = _interopRequireDefault(require("./NativePerformanceObserver"));
var _PerformanceEntry = require("./PerformanceEntry");
var _RawPerformanceEntry = require("./RawPerformanceEntry");
var PerformanceObserverEntryList = function () {
  function PerformanceObserverEntryList(entries) {
    (0, _classCallCheck2.default)(this, PerformanceObserverEntryList);
    this._entries = entries;
  }
  (0, _createClass2.default)(PerformanceObserverEntryList, [{
    key: "getEntries",
    value: function getEntries() {
      return this._entries;
    }
  }, {
    key: "getEntriesByType",
    value: function getEntriesByType(type) {
      return this._entries.filter(function (entry) {
        return entry.entryType === type;
      });
    }
  }, {
    key: "getEntriesByName",
    value: function getEntriesByName(name, type) {
      if (type === undefined) {
        return this._entries.filter(function (entry) {
          return entry.name === name;
        });
      } else {
        return this._entries.filter(function (entry) {
          return entry.name === name && entry.entryType === type;
        });
      }
    }
  }]);
  return PerformanceObserverEntryList;
}();
exports.PerformanceObserverEntryList = PerformanceObserverEntryList;
var observerCountPerEntryType = new Map();
var registeredObservers = new Map();
var isOnPerformanceEntryCallbackSet = false;
var onPerformanceEntry = function onPerformanceEntry() {
  var _entryResult$entries;
  if (!_NativePerformanceObserver.default) {
    return;
  }
  var entryResult = _NativePerformanceObserver.default.popPendingEntries();
  var rawEntries = (_entryResult$entries = entryResult == null ? void 0 : entryResult.entries) != null ? _entryResult$entries : [];
  var droppedEntriesCount = entryResult == null ? void 0 : entryResult.droppedEntriesCount;
  if (rawEntries.length === 0) {
    return;
  }
  var entries = rawEntries.map(_RawPerformanceEntry.rawToPerformanceEntry);
  var _loop = function _loop(observerConfig) {
    var entriesForObserver = entries.filter(function (entry) {
      if (!observerConfig.entryTypes.has(entry.entryType)) {
        return false;
      }
      var durationThreshold = observerConfig.entryTypes.get(entry.entryType);
      return entry.duration >= (durationThreshold != null ? durationThreshold : 0);
    });
    observerConfig.callback(new PerformanceObserverEntryList(entriesForObserver), observer, droppedEntriesCount);
  };
  for (var _ref of registeredObservers.entries()) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2);
    var _observer = _ref2[0];
    var observerConfig = _ref2[1];
    _loop(observerConfig);
  }
};
function warnNoNativePerformanceObserver() {
  (0, _warnOnce.default)('missing-native-performance-observer', 'Missing native implementation of PerformanceObserver');
}
function applyDurationThresholds() {
  var durationThresholds = Array.from(registeredObservers.values()).map(function (config) {
    return config.entryTypes;
  }).reduce(function (accumulator, currentValue) {
    return union(accumulator, currentValue);
  }, new Map());
  for (var _ref5 of durationThresholds) {
    var _ref4 = (0, _slicedToArray2.default)(_ref5, 2);
    var entryType = _ref4[0];
    var durationThreshold = _ref4[1];
    _NativePerformanceObserver.default == null ? void 0 : _NativePerformanceObserver.default.setDurationThreshold((0, _RawPerformanceEntry.performanceEntryTypeToRaw)(entryType), durationThreshold != null ? durationThreshold : 0);
  }
}
var PerformanceObserver = function () {
  function PerformanceObserver(callback) {
    (0, _classCallCheck2.default)(this, PerformanceObserver);
    this._callback = callback;
  }
  (0, _createClass2.default)(PerformanceObserver, [{
    key: "observe",
    value: function observe(options) {
      var _registeredObservers$;
      if (!_NativePerformanceObserver.default) {
        warnNoNativePerformanceObserver();
        return;
      }
      this._validateObserveOptions(options);
      var requestedEntryTypes;
      if (options.entryTypes) {
        this._type = 'multiple';
        requestedEntryTypes = new Map(options.entryTypes.map(function (t) {
          return [t, undefined];
        }));
      } else {
        this._type = 'single';
        requestedEntryTypes = new Map([[options.type, options.durationThreshold]]);
      }
      var currentEntryTypes = (_registeredObservers$ = registeredObservers.get(this)) == null ? void 0 : _registeredObservers$.entryTypes;
      var nextEntryTypes = currentEntryTypes ? union(requestedEntryTypes, currentEntryTypes) : requestedEntryTypes;
      if (currentEntryTypes && currentEntryTypes.size === nextEntryTypes.size) {
        return;
      }
      registeredObservers.set(this, {
        callback: this._callback,
        entryTypes: nextEntryTypes
      });
      if (!isOnPerformanceEntryCallbackSet) {
        _NativePerformanceObserver.default.setOnPerformanceEntryCallback(onPerformanceEntry);
        isOnPerformanceEntryCallbackSet = true;
      }
      var newEntryTypes = currentEntryTypes ? difference(new Set(requestedEntryTypes.keys()), new Set(currentEntryTypes.keys())) : new Set(requestedEntryTypes.keys());
      for (var type of newEntryTypes) {
        var _observerCountPerEntr;
        if (!observerCountPerEntryType.has(type)) {
          var rawType = (0, _RawPerformanceEntry.performanceEntryTypeToRaw)(type);
          _NativePerformanceObserver.default.startReporting(rawType);
        }
        observerCountPerEntryType.set(type, ((_observerCountPerEntr = observerCountPerEntryType.get(type)) != null ? _observerCountPerEntr : 0) + 1);
      }
      applyDurationThresholds();
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      if (!_NativePerformanceObserver.default) {
        warnNoNativePerformanceObserver();
        return;
      }
      var observerConfig = registeredObservers.get(this);
      if (!observerConfig) {
        return;
      }
      for (var type of observerConfig.entryTypes.keys()) {
        var _observerCountPerEntr2;
        var numberOfObserversForThisType = (_observerCountPerEntr2 = observerCountPerEntryType.get(type)) != null ? _observerCountPerEntr2 : 0;
        if (numberOfObserversForThisType === 1) {
          observerCountPerEntryType.delete(type);
          _NativePerformanceObserver.default.stopReporting((0, _RawPerformanceEntry.performanceEntryTypeToRaw)(type));
        } else if (numberOfObserversForThisType !== 0) {
          observerCountPerEntryType.set(type, numberOfObserversForThisType - 1);
        }
      }
      registeredObservers.delete(this);
      if (registeredObservers.size === 0) {
        _NativePerformanceObserver.default.setOnPerformanceEntryCallback(undefined);
        isOnPerformanceEntryCallbackSet = false;
      }
      applyDurationThresholds();
    }
  }, {
    key: "_validateObserveOptions",
    value: function _validateObserveOptions(options) {
      var type = options.type,
        entryTypes = options.entryTypes,
        durationThreshold = options.durationThreshold;
      if (!type && !entryTypes) {
        throw new TypeError("Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and type arguments.");
      }
      if (entryTypes && type) {
        throw new TypeError("Failed to execute 'observe' on 'PerformanceObserver': An observe() call must include either entryTypes or type arguments.");
      }
      if (this._type === 'multiple' && type) {
        throw new Error("Failed to execute 'observe' on 'PerformanceObserver': This observer has performed observe({entryTypes:...}, therefore it cannot perform observe({type:...})");
      }
      if (this._type === 'single' && entryTypes) {
        throw new Error("Failed to execute 'observe' on 'PerformanceObserver': This PerformanceObserver has performed observe({type:...}, therefore it cannot perform observe({entryTypes:...})");
      }
      if (entryTypes && durationThreshold !== undefined) {
        throw new TypeError("Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and durationThreshold arguments.");
      }
    }
  }]);
  return PerformanceObserver;
}();
exports.default = PerformanceObserver;
PerformanceObserver.supportedEntryTypes = Object.freeze(['mark', 'measure', 'event']);
function union(a, b) {
  var res = new Map();
  for (var _ref8 of a) {
    var _ref7 = (0, _slicedToArray2.default)(_ref8, 2);
    var k = _ref7[0];
    var v = _ref7[1];
    if (!b.has(k)) {
      res.set(k, v);
    } else {
      var _b$get;
      res.set(k, Math.min(v != null ? v : 0, (_b$get = b.get(k)) != null ? _b$get : 0));
    }
  }
  return res;
}
function difference(a, b) {
  return new Set((0, _toConsumableArray2.default)(a).filter(function (x) {
    return !b.has(x);
  }));
}
//# sourceMappingURL=PerformanceObserver.js.map