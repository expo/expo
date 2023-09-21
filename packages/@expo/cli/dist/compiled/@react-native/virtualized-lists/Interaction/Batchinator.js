'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _require = require('react-native'),
  InteractionManager = _require.InteractionManager;
var Batchinator = function () {
  function Batchinator(callback, delayMS) {
    (0, _classCallCheck2.default)(this, Batchinator);
    this._delay = delayMS;
    this._callback = callback;
  }
  (0, _createClass2.default)(Batchinator, [{
    key: "dispose",
    value: function dispose() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        abort: false
      };
      if (this._taskHandle) {
        this._taskHandle.cancel();
        if (!options.abort) {
          this._callback();
        }
        this._taskHandle = null;
      }
    }
  }, {
    key: "schedule",
    value: function schedule() {
      var _this = this;
      if (this._taskHandle) {
        return;
      }
      var timeoutHandle = setTimeout(function () {
        _this._taskHandle = InteractionManager.runAfterInteractions(function () {
          _this._taskHandle = null;
          _this._callback();
        });
      }, this._delay);
      this._taskHandle = {
        cancel: function cancel() {
          return clearTimeout(timeoutHandle);
        }
      };
    }
  }]);
  return Batchinator;
}();
module.exports = Batchinator;