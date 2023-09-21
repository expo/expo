var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _RCTDeviceEventEmitter = _interopRequireDefault(require("../EventEmitter/RCTDeviceEventEmitter"));
var _EventEmitter = _interopRequireDefault(require("../vendor/emitter/EventEmitter"));
var _NativeDeviceInfo = _interopRequireDefault(require("./NativeDeviceInfo"));
var _invariant = _interopRequireDefault(require("invariant"));
var eventEmitter = new _EventEmitter.default();
var dimensionsInitialized = false;
var dimensions;
var Dimensions = function () {
  function Dimensions() {
    (0, _classCallCheck2.default)(this, Dimensions);
  }
  (0, _createClass2.default)(Dimensions, null, [{
    key: "get",
    value: function get(dim) {
      (0, _invariant.default)(dimensions[dim], 'No dimension set for key ' + dim);
      return dimensions[dim];
    }
  }, {
    key: "set",
    value: function set(dims) {
      var screen = dims.screen,
        window = dims.window;
      var windowPhysicalPixels = dims.windowPhysicalPixels;
      if (windowPhysicalPixels) {
        window = {
          width: windowPhysicalPixels.width / windowPhysicalPixels.scale,
          height: windowPhysicalPixels.height / windowPhysicalPixels.scale,
          scale: windowPhysicalPixels.scale,
          fontScale: windowPhysicalPixels.fontScale
        };
      }
      var screenPhysicalPixels = dims.screenPhysicalPixels;
      if (screenPhysicalPixels) {
        screen = {
          width: screenPhysicalPixels.width / screenPhysicalPixels.scale,
          height: screenPhysicalPixels.height / screenPhysicalPixels.scale,
          scale: screenPhysicalPixels.scale,
          fontScale: screenPhysicalPixels.fontScale
        };
      } else if (screen == null) {
        screen = window;
      }
      dimensions = {
        window: window,
        screen: screen
      };
      if (dimensionsInitialized) {
        eventEmitter.emit('change', dimensions);
      } else {
        dimensionsInitialized = true;
      }
    }
  }, {
    key: "addEventListener",
    value: function addEventListener(type, handler) {
      (0, _invariant.default)(type === 'change', 'Trying to subscribe to unknown event: "%s"', type);
      return eventEmitter.addListener(type, handler);
    }
  }]);
  return Dimensions;
}();
var initialDims = global.nativeExtensions && global.nativeExtensions.DeviceInfo && global.nativeExtensions.DeviceInfo.Dimensions;
if (!initialDims) {
  _RCTDeviceEventEmitter.default.addListener('didUpdateDimensions', function (update) {
    Dimensions.set(update);
  });
  initialDims = _NativeDeviceInfo.default.getConstants().Dimensions;
}
Dimensions.set(initialDims);
var _default = Dimensions;
exports.default = _default;