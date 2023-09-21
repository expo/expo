var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CellRenderMask = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _invariant = _interopRequireDefault(require("invariant"));
var CellRenderMask = function () {
  function CellRenderMask(numCells) {
    (0, _classCallCheck2.default)(this, CellRenderMask);
    (0, _invariant.default)(numCells >= 0, 'CellRenderMask must contain a non-negative number os cells');
    this._numCells = numCells;
    if (numCells === 0) {
      this._regions = [];
    } else {
      this._regions = [{
        first: 0,
        last: numCells - 1,
        isSpacer: true
      }];
    }
  }
  (0, _createClass2.default)(CellRenderMask, [{
    key: "enumerateRegions",
    value: function enumerateRegions() {
      return this._regions;
    }
  }, {
    key: "addCells",
    value: function addCells(cells) {
      var _this$_regions;
      (0, _invariant.default)(cells.first >= 0 && cells.first < this._numCells && cells.last >= -1 && cells.last < this._numCells && cells.last >= cells.first - 1, 'CellRenderMask.addCells called with invalid cell range');
      if (cells.last < cells.first) {
        return;
      }
      var _this$_findRegion = this._findRegion(cells.first),
        _this$_findRegion2 = (0, _slicedToArray2.default)(_this$_findRegion, 2),
        firstIntersect = _this$_findRegion2[0],
        firstIntersectIdx = _this$_findRegion2[1];
      var _this$_findRegion3 = this._findRegion(cells.last),
        _this$_findRegion4 = (0, _slicedToArray2.default)(_this$_findRegion3, 2),
        lastIntersect = _this$_findRegion4[0],
        lastIntersectIdx = _this$_findRegion4[1];
      if (firstIntersectIdx === lastIntersectIdx && !firstIntersect.isSpacer) {
        return;
      }
      var newLeadRegion = [];
      var newTailRegion = [];
      var newMainRegion = Object.assign({}, cells, {
        isSpacer: false
      });
      if (firstIntersect.first < newMainRegion.first) {
        if (firstIntersect.isSpacer) {
          newLeadRegion.push({
            first: firstIntersect.first,
            last: newMainRegion.first - 1,
            isSpacer: true
          });
        } else {
          newMainRegion.first = firstIntersect.first;
        }
      }
      if (lastIntersect.last > newMainRegion.last) {
        if (lastIntersect.isSpacer) {
          newTailRegion.push({
            first: newMainRegion.last + 1,
            last: lastIntersect.last,
            isSpacer: true
          });
        } else {
          newMainRegion.last = lastIntersect.last;
        }
      }
      var replacementRegions = [].concat(newLeadRegion, [newMainRegion], newTailRegion);
      var numRegionsToDelete = lastIntersectIdx - firstIntersectIdx + 1;
      (_this$_regions = this._regions).splice.apply(_this$_regions, [firstIntersectIdx, numRegionsToDelete].concat((0, _toConsumableArray2.default)(replacementRegions)));
    }
  }, {
    key: "numCells",
    value: function numCells() {
      return this._numCells;
    }
  }, {
    key: "equals",
    value: function equals(other) {
      return this._numCells === other._numCells && this._regions.length === other._regions.length && this._regions.every(function (region, i) {
        return region.first === other._regions[i].first && region.last === other._regions[i].last && region.isSpacer === other._regions[i].isSpacer;
      });
    }
  }, {
    key: "_findRegion",
    value: function _findRegion(cellIdx) {
      var firstIdx = 0;
      var lastIdx = this._regions.length - 1;
      while (firstIdx <= lastIdx) {
        var middleIdx = Math.floor((firstIdx + lastIdx) / 2);
        var middleRegion = this._regions[middleIdx];
        if (cellIdx >= middleRegion.first && cellIdx <= middleRegion.last) {
          return [middleRegion, middleIdx];
        } else if (cellIdx < middleRegion.first) {
          lastIdx = middleIdx - 1;
        } else if (cellIdx > middleRegion.last) {
          firstIdx = middleIdx + 1;
        }
      }
      (0, _invariant.default)(false, `A region was not found containing cellIdx ${cellIdx}`);
    }
  }]);
  return CellRenderMask;
}();
exports.CellRenderMask = CellRenderMask;