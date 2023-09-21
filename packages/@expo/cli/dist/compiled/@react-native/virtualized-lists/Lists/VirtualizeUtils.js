'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computeWindowedRenderLimits = computeWindowedRenderLimits;
exports.elementsThatOverlapOffsets = elementsThatOverlapOffsets;
exports.keyExtractor = keyExtractor;
exports.newRangeCount = newRangeCount;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
function elementsThatOverlapOffsets(offsets, props, getFrameMetrics) {
  var zoomScale = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  var itemCount = props.getItemCount(props.data);
  var result = [];
  for (var offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
    var currentOffset = offsets[offsetIndex];
    var left = 0;
    var right = itemCount - 1;
    while (left <= right) {
      var mid = left + (right - left >>> 1);
      var frame = getFrameMetrics(mid, props);
      var scaledOffsetStart = frame.offset * zoomScale;
      var scaledOffsetEnd = (frame.offset + frame.length) * zoomScale;
      if (mid === 0 && currentOffset < scaledOffsetStart || mid !== 0 && currentOffset <= scaledOffsetStart) {
        right = mid - 1;
      } else if (currentOffset > scaledOffsetEnd) {
        left = mid + 1;
      } else {
        result[offsetIndex] = mid;
        break;
      }
    }
  }
  return result;
}
function newRangeCount(prev, next) {
  return next.last - next.first + 1 - Math.max(0, 1 + Math.min(next.last, prev.last) - Math.max(next.first, prev.first));
}
function computeWindowedRenderLimits(props, maxToRenderPerBatch, windowSize, prev, getFrameMetricsApprox, scrollMetrics) {
  var itemCount = props.getItemCount(props.data);
  if (itemCount === 0) {
    return {
      first: 0,
      last: -1
    };
  }
  var offset = scrollMetrics.offset,
    velocity = scrollMetrics.velocity,
    visibleLength = scrollMetrics.visibleLength,
    _scrollMetrics$zoomSc = scrollMetrics.zoomScale,
    zoomScale = _scrollMetrics$zoomSc === void 0 ? 1 : _scrollMetrics$zoomSc;
  var visibleBegin = Math.max(0, offset);
  var visibleEnd = visibleBegin + visibleLength;
  var overscanLength = (windowSize - 1) * visibleLength;
  var leadFactor = 0.5;
  var fillPreference = velocity > 1 ? 'after' : velocity < -1 ? 'before' : 'none';
  var overscanBegin = Math.max(0, visibleBegin - (1 - leadFactor) * overscanLength);
  var overscanEnd = Math.max(0, visibleEnd + leadFactor * overscanLength);
  var lastItemOffset = getFrameMetricsApprox(itemCount - 1, props).offset * zoomScale;
  if (lastItemOffset < overscanBegin) {
    return {
      first: Math.max(0, itemCount - 1 - maxToRenderPerBatch),
      last: itemCount - 1
    };
  }
  var _elementsThatOverlapO = elementsThatOverlapOffsets([overscanBegin, visibleBegin, visibleEnd, overscanEnd], props, getFrameMetricsApprox, zoomScale),
    _elementsThatOverlapO2 = (0, _slicedToArray2.default)(_elementsThatOverlapO, 4),
    overscanFirst = _elementsThatOverlapO2[0],
    first = _elementsThatOverlapO2[1],
    last = _elementsThatOverlapO2[2],
    overscanLast = _elementsThatOverlapO2[3];
  overscanFirst = overscanFirst == null ? 0 : overscanFirst;
  first = first == null ? Math.max(0, overscanFirst) : first;
  overscanLast = overscanLast == null ? itemCount - 1 : overscanLast;
  last = last == null ? Math.min(overscanLast, first + maxToRenderPerBatch - 1) : last;
  var visible = {
    first: first,
    last: last
  };
  var newCellCount = newRangeCount(prev, visible);
  while (true) {
    if (first <= overscanFirst && last >= overscanLast) {
      break;
    }
    var maxNewCells = newCellCount >= maxToRenderPerBatch;
    var firstWillAddMore = first <= prev.first || first > prev.last;
    var firstShouldIncrement = first > overscanFirst && (!maxNewCells || !firstWillAddMore);
    var lastWillAddMore = last >= prev.last || last < prev.first;
    var lastShouldIncrement = last < overscanLast && (!maxNewCells || !lastWillAddMore);
    if (maxNewCells && !firstShouldIncrement && !lastShouldIncrement) {
      break;
    }
    if (firstShouldIncrement && !(fillPreference === 'after' && lastShouldIncrement && lastWillAddMore)) {
      if (firstWillAddMore) {
        newCellCount++;
      }
      first--;
    }
    if (lastShouldIncrement && !(fillPreference === 'before' && firstShouldIncrement && firstWillAddMore)) {
      if (lastWillAddMore) {
        newCellCount++;
      }
      last++;
    }
  }
  if (!(last >= first && first >= 0 && last < itemCount && first >= overscanFirst && last <= overscanLast && first <= visible.first && last >= visible.last)) {
    throw new Error('Bad window calculation ' + JSON.stringify({
      first: first,
      last: last,
      itemCount: itemCount,
      overscanFirst: overscanFirst,
      overscanLast: overscanLast,
      visible: visible
    }));
  }
  return {
    first: first,
    last: last
  };
}
function keyExtractor(item, index) {
  if (typeof item === 'object' && (item == null ? void 0 : item.key) != null) {
    return item.key;
  }
  if (typeof item === 'object' && (item == null ? void 0 : item.id) != null) {
    return item.id;
  }
  return String(index);
}