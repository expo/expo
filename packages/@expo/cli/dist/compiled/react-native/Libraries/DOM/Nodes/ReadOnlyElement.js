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
var _ReadOnlyNode2 = _interopRequireDefault(require("./ReadOnlyNode"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ReadOnlyElement = function (_ReadOnlyNode) {
  (0, _inherits2.default)(ReadOnlyElement, _ReadOnlyNode);
  var _super = _createSuper(ReadOnlyElement);
  function ReadOnlyElement() {
    (0, _classCallCheck2.default)(this, ReadOnlyElement);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(ReadOnlyElement, [{
    key: "childElementCount",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "children",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "clientHeight",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "clientLeft",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "clientTop",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "clientWidth",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "firstElementChild",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "id",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "lastElementChild",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "nextElementSibling",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "previousElementSibling",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "scrollHeight",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "scrollLeft",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "scrollTop",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "scrollWidth",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "tagName",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "getBoundingClientRect",
    value: function getBoundingClientRect() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "getClientRects",
    value: function getClientRects() {
      throw new TypeError('Unimplemented');
    }
  }]);
  return ReadOnlyElement;
}(_ReadOnlyNode2.default);
exports.default = ReadOnlyElement;
//# sourceMappingURL=ReadOnlyElement.js.map