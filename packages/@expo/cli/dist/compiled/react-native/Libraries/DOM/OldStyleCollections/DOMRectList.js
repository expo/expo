var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDOMRectList = createDOMRectList;
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _ArrayLikeUtils = require("./ArrayLikeUtils");
var DOMRectList = function (_Symbol$iterator) {
  function DOMRectList(elements) {
    (0, _classCallCheck2.default)(this, DOMRectList);
    for (var i = 0; i < elements.length; i++) {
      Object.defineProperty(this, i, {
        value: elements[i],
        enumerable: true,
        configurable: false,
        writable: false
      });
    }
    this._length = elements.length;
  }
  (0, _createClass2.default)(DOMRectList, [{
    key: "length",
    get: function get() {
      return this._length;
    }
  }, {
    key: "item",
    value: function item(index) {
      if (index < 0 || index >= this._length) {
        return null;
      }
      var arrayLike = this;
      return arrayLike[index];
    }
  }, {
    key: _Symbol$iterator,
    value: function value() {
      return (0, _ArrayLikeUtils.createValueIterator)(this);
    }
  }]);
  return DOMRectList;
}(Symbol.iterator);
exports.default = DOMRectList;
function createDOMRectList(elements) {
  return new DOMRectList(elements);
}