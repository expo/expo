'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var InspectorAgent = function () {
  function InspectorAgent(eventSender) {
    (0, _classCallCheck2.default)(this, InspectorAgent);
    this._eventSender = eventSender;
  }
  (0, _createClass2.default)(InspectorAgent, [{
    key: "sendEvent",
    value: function sendEvent(name, params) {
      this._eventSender(name, params);
    }
  }]);
  return InspectorAgent;
}();
module.exports = InspectorAgent;