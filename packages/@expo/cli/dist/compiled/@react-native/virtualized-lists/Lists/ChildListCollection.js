var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _invariant = _interopRequireDefault(require("invariant"));
var ChildListCollection = function () {
  function ChildListCollection() {
    (0, _classCallCheck2.default)(this, ChildListCollection);
    this._cellKeyToChildren = new Map();
    this._childrenToCellKey = new Map();
  }
  (0, _createClass2.default)(ChildListCollection, [{
    key: "add",
    value: function add(list, cellKey) {
      var _this$_cellKeyToChild;
      (0, _invariant.default)(!this._childrenToCellKey.has(list), 'Trying to add already present child list');
      var cellLists = (_this$_cellKeyToChild = this._cellKeyToChildren.get(cellKey)) != null ? _this$_cellKeyToChild : new Set();
      cellLists.add(list);
      this._cellKeyToChildren.set(cellKey, cellLists);
      this._childrenToCellKey.set(list, cellKey);
    }
  }, {
    key: "remove",
    value: function remove(list) {
      var cellKey = this._childrenToCellKey.get(list);
      (0, _invariant.default)(cellKey != null, 'Trying to remove non-present child list');
      this._childrenToCellKey.delete(list);
      var cellLists = this._cellKeyToChildren.get(cellKey);
      (0, _invariant.default)(cellLists, '_cellKeyToChildren should contain cellKey');
      cellLists.delete(list);
      if (cellLists.size === 0) {
        this._cellKeyToChildren.delete(cellKey);
      }
    }
  }, {
    key: "forEach",
    value: function forEach(fn) {
      for (var listSet of this._cellKeyToChildren.values()) {
        for (var list of listSet) {
          fn(list);
        }
      }
    }
  }, {
    key: "forEachInCell",
    value: function forEachInCell(cellKey, fn) {
      var _this$_cellKeyToChild2;
      var listSet = (_this$_cellKeyToChild2 = this._cellKeyToChildren.get(cellKey)) != null ? _this$_cellKeyToChild2 : [];
      for (var list of listSet) {
        fn(list);
      }
    }
  }, {
    key: "anyInCell",
    value: function anyInCell(cellKey, fn) {
      var _this$_cellKeyToChild3;
      var listSet = (_this$_cellKeyToChild3 = this._cellKeyToChildren.get(cellKey)) != null ? _this$_cellKeyToChild3 : [];
      for (var list of listSet) {
        if (fn(list)) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: "size",
    value: function size() {
      return this._childrenToCellKey.size;
    }
  }]);
  return ChildListCollection;
}();
exports.default = ChildListCollection;