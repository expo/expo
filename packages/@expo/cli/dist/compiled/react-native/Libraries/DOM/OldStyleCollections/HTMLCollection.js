var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHTMLCollection = createHTMLCollection;
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _ArrayLikeUtils = require("./ArrayLikeUtils");
var HTMLCollection = function (_Symbol$iterator) {
  function HTMLCollection(elements) {
    (0, _classCallCheck2.default)(this, HTMLCollection);
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
  (0, _createClass2.default)(HTMLCollection, [{
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
    key: "namedItem",
    value: function namedItem(name) {
      return null;
    }
  }, {
    key: _Symbol$iterator,
    value: function value() {
      return (0, _ArrayLikeUtils.createValueIterator)(this);
    }
  }]);
  return HTMLCollection;
}(Symbol.iterator);
exports.default = HTMLCollection;
function createHTMLCollection(elements) {
  return new HTMLCollection(elements);
}