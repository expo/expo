var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNodeList = createNodeList;
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _ArrayLikeUtils = require("./ArrayLikeUtils");
var NodeList = function (_Symbol$iterator) {
  function NodeList(elements) {
    (0, _classCallCheck2.default)(this, NodeList);
    for (var i = 0; i < elements.length; i++) {
      Object.defineProperty(this, i, {
        value: elements[i],
        writable: false
      });
    }
    this._length = elements.length;
  }
  (0, _createClass2.default)(NodeList, [{
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
    key: "entries",
    value: function entries() {
      return (0, _ArrayLikeUtils.createEntriesIterator)(this);
    }
  }, {
    key: "forEach",
    value: function forEach(callbackFn, thisArg) {
      var arrayLike = this;
      for (var _index = 0; _index < this._length; _index++) {
        if (thisArg == null) {
          callbackFn(arrayLike[_index], _index, this);
        } else {
          callbackFn.call(thisArg, arrayLike[_index], _index, this);
        }
      }
    }
  }, {
    key: "keys",
    value: function keys() {
      return (0, _ArrayLikeUtils.createKeyIterator)(this);
    }
  }, {
    key: "values",
    value: function values() {
      return (0, _ArrayLikeUtils.createValueIterator)(this);
    }
  }, {
    key: _Symbol$iterator,
    value: function value() {
      return (0, _ArrayLikeUtils.createValueIterator)(this);
    }
  }]);
  return NodeList;
}(Symbol.iterator);
exports.default = NodeList;
function createNodeList(elements) {
  return new NodeList(elements);
}