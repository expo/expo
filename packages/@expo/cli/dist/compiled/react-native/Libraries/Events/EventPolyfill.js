var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var EventPolyfill = function () {
  function EventPolyfill(type, eventInitDict) {
    (0, _classCallCheck2.default)(this, EventPolyfill);
    this.type = type;
    this.bubbles = !!(eventInitDict != null && eventInitDict.bubbles || false);
    this.cancelable = !!(eventInitDict != null && eventInitDict.cancelable || false);
    this.composed = !!(eventInitDict != null && eventInitDict.composed || false);
    this.scoped = !!(eventInitDict != null && eventInitDict.scoped || false);
    this.isTrusted = false;
    this.timeStamp = Date.now();
    this.defaultPrevented = false;
    this.NONE = 0;
    this.AT_TARGET = 1;
    this.BUBBLING_PHASE = 2;
    this.CAPTURING_PHASE = 3;
    this.eventPhase = this.NONE;
    this.currentTarget = null;
    this.target = null;
    this.srcElement = null;
  }
  (0, _createClass2.default)(EventPolyfill, [{
    key: "composedPath",
    value: function composedPath() {
      throw new Error('TODO: not yet implemented');
    }
  }, {
    key: "preventDefault",
    value: function preventDefault() {
      this.defaultPrevented = true;
      if (this._syntheticEvent != null) {
        this._syntheticEvent.preventDefault();
      }
    }
  }, {
    key: "initEvent",
    value: function initEvent(type, bubbles, cancelable) {
      throw new Error('TODO: not yet implemented. This method is also deprecated.');
    }
  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      throw new Error('TODO: not yet implemented');
    }
  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      if (this._syntheticEvent != null) {
        this._syntheticEvent.stopPropagation();
      }
    }
  }, {
    key: "setSyntheticEvent",
    value: function setSyntheticEvent(value) {
      this._syntheticEvent = value;
    }
  }]);
  return EventPolyfill;
}();
global.Event = EventPolyfill;
var _default = EventPolyfill;
exports.default = _default;