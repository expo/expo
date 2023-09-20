var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PerformanceEventTiming = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _PerformanceEntry2 = require("./PerformanceEntry");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var PerformanceEventTiming = function (_PerformanceEntry) {
  (0, _inherits2.default)(PerformanceEventTiming, _PerformanceEntry);
  var _super = _createSuper(PerformanceEventTiming);
  function PerformanceEventTiming(init) {
    var _init$startTime, _init$duration, _init$processingStart, _init$processingEnd, _init$interactionId;
    var _this;
    (0, _classCallCheck2.default)(this, PerformanceEventTiming);
    _this = _super.call(this, {
      name: init.name,
      entryType: 'event',
      startTime: (_init$startTime = init.startTime) != null ? _init$startTime : 0,
      duration: (_init$duration = init.duration) != null ? _init$duration : 0
    });
    _this.processingStart = (_init$processingStart = init.processingStart) != null ? _init$processingStart : 0;
    _this.processingEnd = (_init$processingEnd = init.processingEnd) != null ? _init$processingEnd : 0;
    _this.interactionId = (_init$interactionId = init.interactionId) != null ? _init$interactionId : 0;
    return _this;
  }
  return (0, _createClass2.default)(PerformanceEventTiming);
}(_PerformanceEntry2.PerformanceEntry);
exports.PerformanceEventTiming = PerformanceEventTiming;
//# sourceMappingURL=PerformanceEventTiming.js.map