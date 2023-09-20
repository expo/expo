'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var Dimensions = require("./Dimensions").default;
var PixelRatio = function () {
  function PixelRatio() {
    (0, _classCallCheck2.default)(this, PixelRatio);
  }
  (0, _createClass2.default)(PixelRatio, null, [{
    key: "get",
    value: function get() {
      return Dimensions.get('window').scale;
    }
  }, {
    key: "getFontScale",
    value: function getFontScale() {
      return Dimensions.get('window').fontScale || PixelRatio.get();
    }
  }, {
    key: "getPixelSizeForLayoutSize",
    value: function getPixelSizeForLayoutSize(layoutSize) {
      return Math.round(layoutSize * PixelRatio.get());
    }
  }, {
    key: "roundToNearestPixel",
    value: function roundToNearestPixel(layoutSize) {
      var ratio = PixelRatio.get();
      return Math.round(layoutSize * ratio) / ratio;
    }
  }, {
    key: "startDetecting",
    value: function startDetecting() {}
  }]);
  return PixelRatio;
}();
var _default = PixelRatio;
exports.default = _default;
//# sourceMappingURL=PixelRatio.js.map