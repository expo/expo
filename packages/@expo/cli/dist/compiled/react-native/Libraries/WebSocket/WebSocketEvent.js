'use strict';
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var WebSocketEvent = (0, _createClass2.default)(function WebSocketEvent(type, eventInitDict) {
  (0, _classCallCheck2.default)(this, WebSocketEvent);
  this.type = type.toString();
  Object.assign(this, eventInitDict);
});
module.exports = WebSocketEvent;
//# sourceMappingURL=WebSocketEvent.js.map