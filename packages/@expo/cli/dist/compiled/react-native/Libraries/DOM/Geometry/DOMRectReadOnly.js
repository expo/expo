var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
function castToNumber(value) {
  return value ? Number(value) : 0;
}
var DOMRectReadOnly = function () {
  function DOMRectReadOnly(x, y, width, height) {
    (0, _classCallCheck2.default)(this, DOMRectReadOnly);
    this.__setInternalX(x);
    this.__setInternalY(y);
    this.__setInternalWidth(width);
    this.__setInternalHeight(height);
  }
  (0, _createClass2.default)(DOMRectReadOnly, [{
    key: "x",
    get: function get() {
      return this._x;
    }
  }, {
    key: "y",
    get: function get() {
      return this._y;
    }
  }, {
    key: "width",
    get: function get() {
      return this._width;
    }
  }, {
    key: "height",
    get: function get() {
      return this._height;
    }
  }, {
    key: "top",
    get: function get() {
      var height = this._height;
      var y = this._y;
      if (height < 0) {
        return y + height;
      }
      return y;
    }
  }, {
    key: "right",
    get: function get() {
      var width = this._width;
      var x = this._x;
      if (width < 0) {
        return x;
      }
      return x + width;
    }
  }, {
    key: "bottom",
    get: function get() {
      var height = this._height;
      var y = this._y;
      if (height < 0) {
        return y;
      }
      return y + height;
    }
  }, {
    key: "left",
    get: function get() {
      var width = this._width;
      var x = this._x;
      if (width < 0) {
        return x + width;
      }
      return x;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var x = this.x,
        y = this.y,
        width = this.width,
        height = this.height,
        top = this.top,
        left = this.left,
        bottom = this.bottom,
        right = this.right;
      return {
        x: x,
        y: y,
        width: width,
        height: height,
        top: top,
        left: left,
        bottom: bottom,
        right: right
      };
    }
  }, {
    key: "__getInternalX",
    value: function __getInternalX() {
      return this._x;
    }
  }, {
    key: "__getInternalY",
    value: function __getInternalY() {
      return this._y;
    }
  }, {
    key: "__getInternalWidth",
    value: function __getInternalWidth() {
      return this._width;
    }
  }, {
    key: "__getInternalHeight",
    value: function __getInternalHeight() {
      return this._height;
    }
  }, {
    key: "__setInternalX",
    value: function __setInternalX(x) {
      this._x = castToNumber(x);
    }
  }, {
    key: "__setInternalY",
    value: function __setInternalY(y) {
      this._y = castToNumber(y);
    }
  }, {
    key: "__setInternalWidth",
    value: function __setInternalWidth(width) {
      this._width = castToNumber(width);
    }
  }, {
    key: "__setInternalHeight",
    value: function __setInternalHeight(height) {
      this._height = castToNumber(height);
    }
  }], [{
    key: "fromRect",
    value: function fromRect(rect) {
      if (!rect) {
        return new DOMRectReadOnly();
      }
      return new DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height);
    }
  }]);
  return DOMRectReadOnly;
}();
exports.default = DOMRectReadOnly;