var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _DOMRectReadOnly2 = _interopRequireDefault(require("./DOMRectReadOnly"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var DOMRect = function (_DOMRectReadOnly) {
  (0, _inherits2.default)(DOMRect, _DOMRectReadOnly);
  var _super = _createSuper(DOMRect);
  function DOMRect() {
    (0, _classCallCheck2.default)(this, DOMRect);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(DOMRect, [{
    key: "x",
    get: function get() {
      return this.__getInternalX();
    },
    set: function set(x) {
      this.__setInternalX(x);
    }
  }, {
    key: "y",
    get: function get() {
      return this.__getInternalY();
    },
    set: function set(y) {
      this.__setInternalY(y);
    }
  }, {
    key: "width",
    get: function get() {
      return this.__getInternalWidth();
    },
    set: function set(width) {
      this.__setInternalWidth(width);
    }
  }, {
    key: "height",
    get: function get() {
      return this.__getInternalHeight();
    },
    set: function set(height) {
      this.__setInternalHeight(height);
    }
  }], [{
    key: "fromRect",
    value: function fromRect(rect) {
      if (!rect) {
        return new DOMRect();
      }
      return new DOMRect(rect.x, rect.y, rect.width, rect.height);
    }
  }]);
  return DOMRect;
}(_DOMRectReadOnly2.default);
exports.default = DOMRect;
//# sourceMappingURL=DOMRect.js.map