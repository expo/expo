var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PerformanceMeasure = exports.PerformanceMark = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _warnOnce = _interopRequireDefault(require("../Utilities/warnOnce"));
var _EventCounts = _interopRequireDefault(require("./EventCounts"));
var _MemoryInfo = _interopRequireDefault(require("./MemoryInfo"));
var _NativePerformance = _interopRequireDefault(require("./NativePerformance"));
var _NativePerformanceObserver = _interopRequireDefault(require("./NativePerformanceObserver"));
var _PerformanceEntry3 = require("./PerformanceEntry");
var _PerformanceObserver = require("./PerformanceObserver");
var _RawPerformanceEntry = require("./RawPerformanceEntry");
var _ReactNativeStartupTiming = _interopRequireDefault(require("./ReactNativeStartupTiming"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var getCurrentTimeStamp = global.nativePerformanceNow ? global.nativePerformanceNow : function () {
  return Date.now();
};
var PerformanceMark = function (_PerformanceEntry) {
  (0, _inherits2.default)(PerformanceMark, _PerformanceEntry);
  var _super = _createSuper(PerformanceMark);
  function PerformanceMark(markName, markOptions) {
    var _markOptions$startTim;
    var _this;
    (0, _classCallCheck2.default)(this, PerformanceMark);
    _this = _super.call(this, {
      name: markName,
      entryType: 'mark',
      startTime: (_markOptions$startTim = markOptions == null ? void 0 : markOptions.startTime) != null ? _markOptions$startTim : getCurrentTimeStamp(),
      duration: 0
    });
    if (markOptions) {
      _this.detail = markOptions.detail;
    }
    return _this;
  }
  return (0, _createClass2.default)(PerformanceMark);
}(_PerformanceEntry3.PerformanceEntry);
exports.PerformanceMark = PerformanceMark;
var PerformanceMeasure = function (_PerformanceEntry2) {
  (0, _inherits2.default)(PerformanceMeasure, _PerformanceEntry2);
  var _super2 = _createSuper(PerformanceMeasure);
  function PerformanceMeasure(measureName, measureOptions) {
    var _measureOptions$durat;
    var _this2;
    (0, _classCallCheck2.default)(this, PerformanceMeasure);
    _this2 = _super2.call(this, {
      name: measureName,
      entryType: 'measure',
      startTime: 0,
      duration: (_measureOptions$durat = measureOptions == null ? void 0 : measureOptions.duration) != null ? _measureOptions$durat : 0
    });
    if (measureOptions) {
      _this2.detail = measureOptions.detail;
    }
    return _this2;
  }
  return (0, _createClass2.default)(PerformanceMeasure);
}(_PerformanceEntry3.PerformanceEntry);
exports.PerformanceMeasure = PerformanceMeasure;
function warnNoNativePerformance() {
  (0, _warnOnce.default)('missing-native-performance', 'Missing native implementation of Performance');
}
var Performance = function () {
  function Performance() {
    (0, _classCallCheck2.default)(this, Performance);
    this.eventCounts = new _EventCounts.default();
  }
  (0, _createClass2.default)(Performance, [{
    key: "memory",
    get: function get() {
      if (_NativePerformance.default != null && _NativePerformance.default.getSimpleMemoryInfo) {
        var memoryInfo = _NativePerformance.default.getSimpleMemoryInfo();
        if (memoryInfo.hasOwnProperty('hermes_heapSize')) {
          var totalJSHeapSize = memoryInfo.hermes_heapSize,
            usedJSHeapSize = memoryInfo.hermes_allocatedBytes;
          return new _MemoryInfo.default({
            jsHeapSizeLimit: null,
            totalJSHeapSize: totalJSHeapSize,
            usedJSHeapSize: usedJSHeapSize
          });
        } else {
          return new _MemoryInfo.default();
        }
      }
      return new _MemoryInfo.default();
    }
  }, {
    key: "reactNativeStartupTiming",
    get: function get() {
      if (_NativePerformance.default != null && _NativePerformance.default.getReactNativeStartupTiming) {
        return new _ReactNativeStartupTiming.default(_NativePerformance.default.getReactNativeStartupTiming());
      }
      return new _ReactNativeStartupTiming.default();
    }
  }, {
    key: "mark",
    value: function mark(markName, markOptions) {
      var mark = new PerformanceMark(markName, markOptions);
      if (_NativePerformance.default != null && _NativePerformance.default.mark) {
        _NativePerformance.default.mark(markName, mark.startTime, mark.duration);
      } else {
        warnNoNativePerformance();
      }
      return mark;
    }
  }, {
    key: "clearMarks",
    value: function clearMarks(markName) {
      if (!(_NativePerformanceObserver.default != null && _NativePerformanceObserver.default.clearEntries)) {
        (0, _PerformanceObserver.warnNoNativePerformanceObserver)();
        return;
      }
      _NativePerformanceObserver.default == null ? void 0 : _NativePerformanceObserver.default.clearEntries(_RawPerformanceEntry.RawPerformanceEntryTypeValues.MARK, markName);
    }
  }, {
    key: "measure",
    value: function measure(measureName, startMarkOrOptions, endMark) {
      var options;
      var startMarkName,
        endMarkName = endMark,
        duration,
        startTime = 0,
        endTime = 0;
      if (typeof startMarkOrOptions === 'string') {
        startMarkName = startMarkOrOptions;
      } else if (startMarkOrOptions !== undefined) {
        var _options$duration;
        options = startMarkOrOptions;
        if (endMark !== undefined) {
          throw new TypeError("Performance.measure: Can't have both options and endMark");
        }
        if (options.start === undefined && options.end === undefined) {
          throw new TypeError('Performance.measure: Must have at least one of start/end specified in options');
        }
        if (options.start !== undefined && options.end !== undefined && options.duration !== undefined) {
          throw new TypeError("Performance.measure: Can't have both start/end and duration explicitly in options");
        }
        if (typeof options.start === 'number') {
          startTime = options.start;
        } else {
          startMarkName = options.start;
        }
        if (typeof options.end === 'number') {
          endTime = options.end;
        } else {
          endMarkName = options.end;
        }
        duration = (_options$duration = options.duration) != null ? _options$duration : duration;
      }
      var measure = new PerformanceMeasure(measureName, options);
      if (_NativePerformance.default != null && _NativePerformance.default.measure) {
        _NativePerformance.default.measure(measureName, startTime, endTime, duration, startMarkName, endMarkName);
      } else {
        warnNoNativePerformance();
      }
      return measure;
    }
  }, {
    key: "clearMeasures",
    value: function clearMeasures(measureName) {
      if (!(_NativePerformanceObserver.default != null && _NativePerformanceObserver.default.clearEntries)) {
        (0, _PerformanceObserver.warnNoNativePerformanceObserver)();
        return;
      }
      _NativePerformanceObserver.default == null ? void 0 : _NativePerformanceObserver.default.clearEntries(_RawPerformanceEntry.RawPerformanceEntryTypeValues.MEASURE, measureName);
    }
  }, {
    key: "now",
    value: function now() {
      return getCurrentTimeStamp();
    }
  }, {
    key: "getEntries",
    value: function getEntries() {
      if (!(_NativePerformanceObserver.default != null && _NativePerformanceObserver.default.clearEntries)) {
        (0, _PerformanceObserver.warnNoNativePerformanceObserver)();
        return [];
      }
      return _NativePerformanceObserver.default.getEntries().map(_RawPerformanceEntry.rawToPerformanceEntry);
    }
  }, {
    key: "getEntriesByType",
    value: function getEntriesByType(entryType) {
      if (entryType !== 'mark' && entryType !== 'measure') {
        console.log(`Performance.getEntriesByType: Only valid for 'mark' and 'measure' entry types, got ${entryType}`);
        return [];
      }
      if (!(_NativePerformanceObserver.default != null && _NativePerformanceObserver.default.clearEntries)) {
        (0, _PerformanceObserver.warnNoNativePerformanceObserver)();
        return [];
      }
      return _NativePerformanceObserver.default.getEntries((0, _RawPerformanceEntry.performanceEntryTypeToRaw)(entryType)).map(_RawPerformanceEntry.rawToPerformanceEntry);
    }
  }, {
    key: "getEntriesByName",
    value: function getEntriesByName(entryName, entryType) {
      if (entryType !== undefined && entryType !== 'mark' && entryType !== 'measure') {
        console.log(`Performance.getEntriesByName: Only valid for 'mark' and 'measure' entry types, got ${entryType}`);
        return [];
      }
      if (!(_NativePerformanceObserver.default != null && _NativePerformanceObserver.default.clearEntries)) {
        (0, _PerformanceObserver.warnNoNativePerformanceObserver)();
        return [];
      }
      return _NativePerformanceObserver.default.getEntries(entryType != null ? (0, _RawPerformanceEntry.performanceEntryTypeToRaw)(entryType) : undefined, entryName).map(_RawPerformanceEntry.rawToPerformanceEntry);
    }
  }]);
  return Performance;
}();
exports.default = Performance;
//# sourceMappingURL=Performance.js.map