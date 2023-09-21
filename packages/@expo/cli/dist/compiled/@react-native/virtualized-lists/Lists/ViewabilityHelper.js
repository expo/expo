'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var invariant = require('invariant');
var ViewabilityHelper = function () {
  function ViewabilityHelper() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      viewAreaCoveragePercentThreshold: 0
    };
    (0, _classCallCheck2.default)(this, ViewabilityHelper);
    this._hasInteracted = false;
    this._timers = new Set();
    this._viewableIndices = [];
    this._viewableItems = new Map();
    this._config = config;
  }
  (0, _createClass2.default)(ViewabilityHelper, [{
    key: "dispose",
    value: function dispose() {
      this._timers.forEach(clearTimeout);
    }
  }, {
    key: "computeViewableItems",
    value: function computeViewableItems(props, scrollOffset, viewportHeight, getFrameMetrics, renderRange) {
      var itemCount = props.getItemCount(props.data);
      var _this$_config = this._config,
        itemVisiblePercentThreshold = _this$_config.itemVisiblePercentThreshold,
        viewAreaCoveragePercentThreshold = _this$_config.viewAreaCoveragePercentThreshold;
      var viewAreaMode = viewAreaCoveragePercentThreshold != null;
      var viewablePercentThreshold = viewAreaMode ? viewAreaCoveragePercentThreshold : itemVisiblePercentThreshold;
      invariant(viewablePercentThreshold != null && itemVisiblePercentThreshold != null !== (viewAreaCoveragePercentThreshold != null), 'Must set exactly one of itemVisiblePercentThreshold or viewAreaCoveragePercentThreshold');
      var viewableIndices = [];
      if (itemCount === 0) {
        return viewableIndices;
      }
      var firstVisible = -1;
      var _ref = renderRange || {
          first: 0,
          last: itemCount - 1
        },
        first = _ref.first,
        last = _ref.last;
      if (last >= itemCount) {
        console.warn('Invalid render range computing viewability ' + JSON.stringify({
          renderRange: renderRange,
          itemCount: itemCount
        }));
        return [];
      }
      for (var idx = first; idx <= last; idx++) {
        var metrics = getFrameMetrics(idx, props);
        if (!metrics) {
          continue;
        }
        var top = metrics.offset - scrollOffset;
        var bottom = top + metrics.length;
        if (top < viewportHeight && bottom > 0) {
          firstVisible = idx;
          if (_isViewable(viewAreaMode, viewablePercentThreshold, top, bottom, viewportHeight, metrics.length)) {
            viewableIndices.push(idx);
          }
        } else if (firstVisible >= 0) {
          break;
        }
      }
      return viewableIndices;
    }
  }, {
    key: "onUpdate",
    value: function onUpdate(props, scrollOffset, viewportHeight, getFrameMetrics, createViewToken, onViewableItemsChanged, renderRange) {
      var _this = this;
      var itemCount = props.getItemCount(props.data);
      if (this._config.waitForInteraction && !this._hasInteracted || itemCount === 0 || !getFrameMetrics(0, props)) {
        return;
      }
      var viewableIndices = [];
      if (itemCount) {
        viewableIndices = this.computeViewableItems(props, scrollOffset, viewportHeight, getFrameMetrics, renderRange);
      }
      if (this._viewableIndices.length === viewableIndices.length && this._viewableIndices.every(function (v, ii) {
        return v === viewableIndices[ii];
      })) {
        return;
      }
      this._viewableIndices = viewableIndices;
      if (this._config.minimumViewTime) {
        var handle = setTimeout(function () {
          _this._timers.delete(handle);
          _this._onUpdateSync(props, viewableIndices, onViewableItemsChanged, createViewToken);
        }, this._config.minimumViewTime);
        this._timers.add(handle);
      } else {
        this._onUpdateSync(props, viewableIndices, onViewableItemsChanged, createViewToken);
      }
    }
  }, {
    key: "resetViewableIndices",
    value: function resetViewableIndices() {
      this._viewableIndices = [];
    }
  }, {
    key: "recordInteraction",
    value: function recordInteraction() {
      this._hasInteracted = true;
    }
  }, {
    key: "_onUpdateSync",
    value: function _onUpdateSync(props, viewableIndicesToCheck, onViewableItemsChanged, createViewToken) {
      var _this2 = this;
      viewableIndicesToCheck = viewableIndicesToCheck.filter(function (ii) {
        return _this2._viewableIndices.includes(ii);
      });
      var prevItems = this._viewableItems;
      var nextItems = new Map(viewableIndicesToCheck.map(function (ii) {
        var viewable = createViewToken(ii, true, props);
        return [viewable.key, viewable];
      }));
      var changed = [];
      for (var _ref2 of nextItems) {
        var _ref3 = (0, _slicedToArray2.default)(_ref2, 2);
        var key = _ref3[0];
        var viewable = _ref3[1];
        if (!prevItems.has(key)) {
          changed.push(viewable);
        }
      }
      for (var _ref4 of prevItems) {
        var _ref5 = (0, _slicedToArray2.default)(_ref4, 2);
        var _key = _ref5[0];
        var _viewable = _ref5[1];
        if (!nextItems.has(_key)) {
          changed.push(Object.assign({}, _viewable, {
            isViewable: false
          }));
        }
      }
      if (changed.length > 0) {
        this._viewableItems = nextItems;
        onViewableItemsChanged({
          viewableItems: Array.from(nextItems.values()),
          changed: changed,
          viewabilityConfig: this._config
        });
      }
    }
  }]);
  return ViewabilityHelper;
}();
function _isViewable(viewAreaMode, viewablePercentThreshold, top, bottom, viewportHeight, itemLength) {
  if (_isEntirelyVisible(top, bottom, viewportHeight)) {
    return true;
  } else {
    var pixels = _getPixelsVisible(top, bottom, viewportHeight);
    var percent = 100 * (viewAreaMode ? pixels / viewportHeight : pixels / itemLength);
    return percent >= viewablePercentThreshold;
  }
}
function _getPixelsVisible(top, bottom, viewportHeight) {
  var visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  return Math.max(0, visibleHeight);
}
function _isEntirelyVisible(top, bottom, viewportHeight) {
  return top >= 0 && bottom <= viewportHeight && bottom > top;
}
module.exports = ViewabilityHelper;