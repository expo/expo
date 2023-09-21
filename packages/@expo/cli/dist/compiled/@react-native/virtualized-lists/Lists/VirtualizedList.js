var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _reactNative = require("react-native");
var _Batchinator = _interopRequireDefault(require("../Interaction/Batchinator"));
var _clamp = _interopRequireDefault(require("../Utilities/clamp"));
var _infoLog = _interopRequireDefault(require("../Utilities/infoLog"));
var _CellRenderMask = require("./CellRenderMask");
var _ChildListCollection = _interopRequireDefault(require("./ChildListCollection"));
var _FillRateHelper = _interopRequireDefault(require("./FillRateHelper"));
var _StateSafePureComponent = _interopRequireDefault(require("./StateSafePureComponent"));
var _ViewabilityHelper = _interopRequireDefault(require("./ViewabilityHelper"));
var _VirtualizedListCellRenderer = _interopRequireDefault(require("./VirtualizedListCellRenderer"));
var _VirtualizedListContext = require("./VirtualizedListContext.js");
var _VirtualizeUtils = require("./VirtualizeUtils");
var _invariant = _interopRequireDefault(require("invariant"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ON_EDGE_REACHED_EPSILON = 0.001;
var _usedIndexForKey = false;
var _keylessItemComponentName = '';
function horizontalOrDefault(horizontal) {
  return horizontal != null ? horizontal : false;
}
function initialNumToRenderOrDefault(initialNumToRender) {
  return initialNumToRender != null ? initialNumToRender : 10;
}
function maxToRenderPerBatchOrDefault(maxToRenderPerBatch) {
  return maxToRenderPerBatch != null ? maxToRenderPerBatch : 10;
}
function onStartReachedThresholdOrDefault(onStartReachedThreshold) {
  return onStartReachedThreshold != null ? onStartReachedThreshold : 2;
}
function onEndReachedThresholdOrDefault(onEndReachedThreshold) {
  return onEndReachedThreshold != null ? onEndReachedThreshold : 2;
}
function getScrollingThreshold(threshold, visibleLength) {
  return threshold * visibleLength / 2;
}
function scrollEventThrottleOrDefault(scrollEventThrottle) {
  return scrollEventThrottle != null ? scrollEventThrottle : 50;
}
function windowSizeOrDefault(windowSize) {
  return windowSize != null ? windowSize : 21;
}
function findLastWhere(arr, predicate) {
  for (var i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }
  return null;
}
var VirtualizedList = function (_StateSafePureCompone) {
  (0, _inherits2.default)(VirtualizedList, _StateSafePureCompone);
  var _super = _createSuper(VirtualizedList);
  function VirtualizedList(_props) {
    var _this$props$updateCel, _this$props$maintainV, _this$props$maintainV2;
    var _this;
    (0, _classCallCheck2.default)(this, VirtualizedList);
    _this = _super.call(this, _props);
    _this._getScrollMetrics = function () {
      return _this._scrollMetrics;
    };
    _this._getOutermostParentListRef = function () {
      if (_this._isNestedWithSameOrientation()) {
        return _this.context.getOutermostParentListRef();
      } else {
        return (0, _assertThisInitialized2.default)(_this);
      }
    };
    _this._registerAsNestedChild = function (childList) {
      _this._nestedChildLists.add(childList.ref, childList.cellKey);
      if (_this._hasInteracted) {
        childList.ref.recordInteraction();
      }
    };
    _this._unregisterAsNestedChild = function (childList) {
      _this._nestedChildLists.remove(childList.ref);
    };
    _this._onUpdateSeparators = function (keys, newProps) {
      keys.forEach(function (key) {
        var ref = key != null && _this._cellRefs[key];
        ref && ref.updateSeparatorProps(newProps);
      });
    };
    _this._getSpacerKey = function (isVertical) {
      return isVertical ? 'height' : 'width';
    };
    _this._averageCellLength = 0;
    _this._cellRefs = {};
    _this._frames = {};
    _this._footerLength = 0;
    _this._hasTriggeredInitialScrollToIndex = false;
    _this._hasInteracted = false;
    _this._hasMore = false;
    _this._hasWarned = {};
    _this._headerLength = 0;
    _this._hiPriInProgress = false;
    _this._highestMeasuredFrameIndex = 0;
    _this._indicesToKeys = new Map();
    _this._lastFocusedCellKey = null;
    _this._nestedChildLists = new _ChildListCollection.default();
    _this._offsetFromParentVirtualizedList = 0;
    _this._prevParentOffset = 0;
    _this._scrollMetrics = {
      contentLength: 0,
      dOffset: 0,
      dt: 10,
      offset: 0,
      timestamp: 0,
      velocity: 0,
      visibleLength: 0,
      zoomScale: 1
    };
    _this._scrollRef = null;
    _this._sentStartForContentLength = 0;
    _this._sentEndForContentLength = 0;
    _this._totalCellLength = 0;
    _this._totalCellsMeasured = 0;
    _this._viewabilityTuples = [];
    _this._captureScrollRef = function (ref) {
      _this._scrollRef = ref;
    };
    _this._defaultRenderScrollComponent = function (props) {
      var onRefresh = props.onRefresh;
      if (_this._isNestedWithSameOrientation()) {
        return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
      } else if (onRefresh) {
        var _props$refreshing;
        (0, _invariant.default)(typeof props.refreshing === 'boolean', '`refreshing` prop must be set as a boolean in order to use `onRefresh`, but got `' + JSON.stringify((_props$refreshing = props.refreshing) != null ? _props$refreshing : 'undefined') + '`');
        return (0, _jsxRuntime.jsx)(_reactNative.ScrollView, Object.assign({}, props, {
          refreshControl: props.refreshControl == null ? (0, _jsxRuntime.jsx)(_reactNative.RefreshControl, {
            refreshing: props.refreshing,
            onRefresh: onRefresh,
            progressViewOffset: props.progressViewOffset
          }) : props.refreshControl
        }));
      } else {
        return (0, _jsxRuntime.jsx)(_reactNative.ScrollView, Object.assign({}, props));
      }
    };
    _this._onCellLayout = function (e, cellKey, index) {
      var layout = e.nativeEvent.layout;
      var next = {
        offset: _this._selectOffset(layout),
        length: _this._selectLength(layout),
        index: index,
        inLayout: true
      };
      var curr = _this._frames[cellKey];
      if (!curr || next.offset !== curr.offset || next.length !== curr.length || index !== curr.index) {
        _this._totalCellLength += next.length - (curr ? curr.length : 0);
        _this._totalCellsMeasured += curr ? 0 : 1;
        _this._averageCellLength = _this._totalCellLength / _this._totalCellsMeasured;
        _this._frames[cellKey] = next;
        _this._highestMeasuredFrameIndex = Math.max(_this._highestMeasuredFrameIndex, index);
        _this._scheduleCellsToRenderUpdate();
      } else {
        _this._frames[cellKey].inLayout = true;
      }
      _this._triggerRemeasureForChildListsInCell(cellKey);
      _this._computeBlankness();
      _this._updateViewableItems(_this.props, _this.state.cellsAroundViewport);
    };
    _this._onCellUnmount = function (cellKey) {
      delete _this._cellRefs[cellKey];
      var curr = _this._frames[cellKey];
      if (curr) {
        _this._frames[cellKey] = Object.assign({}, curr, {
          inLayout: false
        });
      }
    };
    _this._onLayout = function (e) {
      if (_this._isNestedWithSameOrientation()) {
        _this.measureLayoutRelativeToContainingList();
      } else {
        _this._scrollMetrics.visibleLength = _this._selectLength(e.nativeEvent.layout);
      }
      _this.props.onLayout && _this.props.onLayout(e);
      _this._scheduleCellsToRenderUpdate();
      _this._maybeCallOnEdgeReached();
    };
    _this._onLayoutEmpty = function (e) {
      _this.props.onLayout && _this.props.onLayout(e);
    };
    _this._onLayoutFooter = function (e) {
      _this._triggerRemeasureForChildListsInCell(_this._getFooterCellKey());
      _this._footerLength = _this._selectLength(e.nativeEvent.layout);
    };
    _this._onLayoutHeader = function (e) {
      _this._headerLength = _this._selectLength(e.nativeEvent.layout);
    };
    _this._onContentSizeChange = function (width, height) {
      if (width > 0 && height > 0 && _this.props.initialScrollIndex != null && _this.props.initialScrollIndex > 0 && !_this._hasTriggeredInitialScrollToIndex) {
        if (_this.props.contentOffset == null) {
          if (_this.props.initialScrollIndex < _this.props.getItemCount(_this.props.data)) {
            _this.scrollToIndex({
              animated: false,
              index: (0, _nullthrows.default)(_this.props.initialScrollIndex)
            });
          } else {
            _this.scrollToEnd({
              animated: false
            });
          }
        }
        _this._hasTriggeredInitialScrollToIndex = true;
      }
      if (_this.props.onContentSizeChange) {
        _this.props.onContentSizeChange(width, height);
      }
      _this._scrollMetrics.contentLength = _this._selectLength({
        height: height,
        width: width
      });
      _this._scheduleCellsToRenderUpdate();
      _this._maybeCallOnEdgeReached();
    };
    _this._convertParentScrollMetrics = function (metrics) {
      var offset = metrics.offset - _this._offsetFromParentVirtualizedList;
      var visibleLength = metrics.visibleLength;
      var dOffset = offset - _this._scrollMetrics.offset;
      var contentLength = _this._scrollMetrics.contentLength;
      return {
        visibleLength: visibleLength,
        contentLength: contentLength,
        offset: offset,
        dOffset: dOffset
      };
    };
    _this._onScroll = function (e) {
      _this._nestedChildLists.forEach(function (childList) {
        childList._onScroll(e);
      });
      if (_this.props.onScroll) {
        _this.props.onScroll(e);
      }
      var timestamp = e.timeStamp;
      var visibleLength = _this._selectLength(e.nativeEvent.layoutMeasurement);
      var contentLength = _this._selectLength(e.nativeEvent.contentSize);
      var offset = _this._selectOffset(e.nativeEvent.contentOffset);
      var dOffset = offset - _this._scrollMetrics.offset;
      if (_this._isNestedWithSameOrientation()) {
        if (_this._scrollMetrics.contentLength === 0) {
          return;
        }
        var _this$_convertParentS = _this._convertParentScrollMetrics({
          visibleLength: visibleLength,
          offset: offset
        });
        visibleLength = _this$_convertParentS.visibleLength;
        contentLength = _this$_convertParentS.contentLength;
        offset = _this$_convertParentS.offset;
        dOffset = _this$_convertParentS.dOffset;
      }
      var dt = _this._scrollMetrics.timestamp ? Math.max(1, timestamp - _this._scrollMetrics.timestamp) : 1;
      var velocity = dOffset / dt;
      if (dt > 500 && _this._scrollMetrics.dt > 500 && contentLength > 5 * visibleLength && !_this._hasWarned.perf) {
        (0, _infoLog.default)('VirtualizedList: You have a large list that is slow to update - make sure your ' + 'renderItem function renders components that follow React performance best practices ' + 'like PureComponent, shouldComponentUpdate, etc.', {
          dt: dt,
          prevDt: _this._scrollMetrics.dt,
          contentLength: contentLength
        });
        _this._hasWarned.perf = true;
      }
      var zoomScale = e.nativeEvent.zoomScale < 0 ? 1 : e.nativeEvent.zoomScale;
      _this._scrollMetrics = {
        contentLength: contentLength,
        dt: dt,
        dOffset: dOffset,
        offset: offset,
        timestamp: timestamp,
        velocity: velocity,
        visibleLength: visibleLength,
        zoomScale: zoomScale
      };
      if (_this.state.pendingScrollUpdateCount > 0) {
        _this.setState(function (state) {
          return {
            pendingScrollUpdateCount: state.pendingScrollUpdateCount - 1
          };
        });
      }
      _this._updateViewableItems(_this.props, _this.state.cellsAroundViewport);
      if (!_this.props) {
        return;
      }
      _this._maybeCallOnEdgeReached();
      if (velocity !== 0) {
        _this._fillRateHelper.activate();
      }
      _this._computeBlankness();
      _this._scheduleCellsToRenderUpdate();
    };
    _this._onScrollBeginDrag = function (e) {
      _this._nestedChildLists.forEach(function (childList) {
        childList._onScrollBeginDrag(e);
      });
      _this._viewabilityTuples.forEach(function (tuple) {
        tuple.viewabilityHelper.recordInteraction();
      });
      _this._hasInteracted = true;
      _this.props.onScrollBeginDrag && _this.props.onScrollBeginDrag(e);
    };
    _this._onScrollEndDrag = function (e) {
      _this._nestedChildLists.forEach(function (childList) {
        childList._onScrollEndDrag(e);
      });
      var velocity = e.nativeEvent.velocity;
      if (velocity) {
        _this._scrollMetrics.velocity = _this._selectOffset(velocity);
      }
      _this._computeBlankness();
      _this.props.onScrollEndDrag && _this.props.onScrollEndDrag(e);
    };
    _this._onMomentumScrollBegin = function (e) {
      _this._nestedChildLists.forEach(function (childList) {
        childList._onMomentumScrollBegin(e);
      });
      _this.props.onMomentumScrollBegin && _this.props.onMomentumScrollBegin(e);
    };
    _this._onMomentumScrollEnd = function (e) {
      _this._nestedChildLists.forEach(function (childList) {
        childList._onMomentumScrollEnd(e);
      });
      _this._scrollMetrics.velocity = 0;
      _this._computeBlankness();
      _this.props.onMomentumScrollEnd && _this.props.onMomentumScrollEnd(e);
    };
    _this._updateCellsToRender = function () {
      _this._updateViewableItems(_this.props, _this.state.cellsAroundViewport);
      _this.setState(function (state, props) {
        var cellsAroundViewport = _this._adjustCellsAroundViewport(props, state.cellsAroundViewport, state.pendingScrollUpdateCount);
        var renderMask = VirtualizedList._createRenderMask(props, cellsAroundViewport, _this._getNonViewportRenderRegions(props));
        if (cellsAroundViewport.first === state.cellsAroundViewport.first && cellsAroundViewport.last === state.cellsAroundViewport.last && renderMask.equals(state.renderMask)) {
          return null;
        }
        return {
          cellsAroundViewport: cellsAroundViewport,
          renderMask: renderMask
        };
      });
    };
    _this._createViewToken = function (index, isViewable, props) {
      var data = props.data,
        getItem = props.getItem;
      var item = getItem(data, index);
      return {
        index: index,
        item: item,
        key: VirtualizedList._keyExtractor(item, index, props),
        isViewable: isViewable
      };
    };
    _this._getOffsetApprox = function (index, props) {
      if (Number.isInteger(index)) {
        return _this.__getFrameMetricsApprox(index, props).offset;
      } else {
        var frameMetrics = _this.__getFrameMetricsApprox(Math.floor(index), props);
        var remainder = index - Math.floor(index);
        return frameMetrics.offset + remainder * frameMetrics.length;
      }
    };
    _this.__getFrameMetricsApprox = function (index, props) {
      var frame = _this._getFrameMetrics(index, props);
      if (frame && frame.index === index) {
        return frame;
      } else {
        var data = props.data,
          getItemCount = props.getItemCount,
          getItemLayout = props.getItemLayout;
        (0, _invariant.default)(index >= 0 && index < getItemCount(data), 'Tried to get frame for out of range index ' + index);
        (0, _invariant.default)(!getItemLayout, 'Should not have to estimate frames when a measurement metrics function is provided');
        return {
          length: _this._averageCellLength,
          offset: _this._averageCellLength * index
        };
      }
    };
    _this._getFrameMetrics = function (index, props) {
      var data = props.data,
        getItemCount = props.getItemCount,
        getItemLayout = props.getItemLayout;
      (0, _invariant.default)(index >= 0 && index < getItemCount(data), 'Tried to get frame for out of range index ' + index);
      var frame = _this._frames[VirtualizedList._getItemKey(props, index)];
      if (!frame || frame.index !== index) {
        if (getItemLayout) {
          return getItemLayout(data, index);
        }
      }
      return frame;
    };
    _this._getNonViewportRenderRegions = function (props) {
      if (!(_this._lastFocusedCellKey && _this._cellRefs[_this._lastFocusedCellKey])) {
        return [];
      }
      var lastFocusedCellRenderer = _this._cellRefs[_this._lastFocusedCellKey];
      var focusedCellIndex = lastFocusedCellRenderer.props.index;
      var itemCount = props.getItemCount(props.data);
      if (focusedCellIndex >= itemCount || VirtualizedList._getItemKey(props, focusedCellIndex) !== _this._lastFocusedCellKey) {
        return [];
      }
      var first = focusedCellIndex;
      var heightOfCellsBeforeFocused = 0;
      for (var i = first - 1; i >= 0 && heightOfCellsBeforeFocused < _this._scrollMetrics.visibleLength; i--) {
        first--;
        heightOfCellsBeforeFocused += _this.__getFrameMetricsApprox(i, props).length;
      }
      var last = focusedCellIndex;
      var heightOfCellsAfterFocused = 0;
      for (var _i = last + 1; _i < itemCount && heightOfCellsAfterFocused < _this._scrollMetrics.visibleLength; _i++) {
        last++;
        heightOfCellsAfterFocused += _this.__getFrameMetricsApprox(_i, props).length;
      }
      return [{
        first: first,
        last: last
      }];
    };
    _this._checkProps(_props);
    _this._fillRateHelper = new _FillRateHelper.default(_this._getFrameMetrics);
    _this._updateCellsToRenderBatcher = new _Batchinator.default(_this._updateCellsToRender, (_this$props$updateCel = _this.props.updateCellsBatchingPeriod) != null ? _this$props$updateCel : 50);
    if (_this.props.viewabilityConfigCallbackPairs) {
      _this._viewabilityTuples = _this.props.viewabilityConfigCallbackPairs.map(function (pair) {
        return {
          viewabilityHelper: new _ViewabilityHelper.default(pair.viewabilityConfig),
          onViewableItemsChanged: pair.onViewableItemsChanged
        };
      });
    } else {
      var _this$props = _this.props,
        onViewableItemsChanged = _this$props.onViewableItemsChanged,
        viewabilityConfig = _this$props.viewabilityConfig;
      if (onViewableItemsChanged) {
        _this._viewabilityTuples.push({
          viewabilityHelper: new _ViewabilityHelper.default(viewabilityConfig),
          onViewableItemsChanged: onViewableItemsChanged
        });
      }
    }
    var initialRenderRegion = VirtualizedList._initialRenderRegion(_props);
    var minIndexForVisible = (_this$props$maintainV = (_this$props$maintainV2 = _this.props.maintainVisibleContentPosition) == null ? void 0 : _this$props$maintainV2.minIndexForVisible) != null ? _this$props$maintainV : 0;
    _this.state = {
      cellsAroundViewport: initialRenderRegion,
      renderMask: VirtualizedList._createRenderMask(_props, initialRenderRegion),
      firstVisibleItemKey: _this.props.getItemCount(_this.props.data) > minIndexForVisible ? VirtualizedList._getItemKey(_this.props, minIndexForVisible) : null,
      pendingScrollUpdateCount: _this.props.initialScrollIndex != null && _this.props.initialScrollIndex > 0 ? 1 : 0
    };
    return _this;
  }
  (0, _createClass2.default)(VirtualizedList, [{
    key: "scrollToEnd",
    value: function scrollToEnd(params) {
      var animated = params ? params.animated : true;
      var veryLast = this.props.getItemCount(this.props.data) - 1;
      if (veryLast < 0) {
        return;
      }
      var frame = this.__getFrameMetricsApprox(veryLast, this.props);
      var offset = Math.max(0, frame.offset + frame.length + this._footerLength - this._scrollMetrics.visibleLength);
      if (this._scrollRef == null) {
        return;
      }
      if (this._scrollRef.scrollTo == null) {
        console.warn('No scrollTo method provided. This may be because you have two nested ' + 'VirtualizedLists with the same orientation, or because you are ' + 'using a custom component that does not implement scrollTo.');
        return;
      }
      this._scrollRef.scrollTo(horizontalOrDefault(this.props.horizontal) ? {
        x: offset,
        animated: animated
      } : {
        y: offset,
        animated: animated
      });
    }
  }, {
    key: "scrollToIndex",
    value: function scrollToIndex(params) {
      var _this$props2 = this.props,
        data = _this$props2.data,
        horizontal = _this$props2.horizontal,
        getItemCount = _this$props2.getItemCount,
        getItemLayout = _this$props2.getItemLayout,
        onScrollToIndexFailed = _this$props2.onScrollToIndexFailed;
      var animated = params.animated,
        index = params.index,
        viewOffset = params.viewOffset,
        viewPosition = params.viewPosition;
      (0, _invariant.default)(index >= 0, `scrollToIndex out of range: requested index ${index} but minimum is 0`);
      (0, _invariant.default)(getItemCount(data) >= 1, `scrollToIndex out of range: item length ${getItemCount(data)} but minimum is 1`);
      (0, _invariant.default)(index < getItemCount(data), `scrollToIndex out of range: requested index ${index} is out of 0 to ${getItemCount(data) - 1}`);
      if (!getItemLayout && index > this._highestMeasuredFrameIndex) {
        (0, _invariant.default)(!!onScrollToIndexFailed, 'scrollToIndex should be used in conjunction with getItemLayout or onScrollToIndexFailed, ' + 'otherwise there is no way to know the location of offscreen indices or handle failures.');
        onScrollToIndexFailed({
          averageItemLength: this._averageCellLength,
          highestMeasuredFrameIndex: this._highestMeasuredFrameIndex,
          index: index
        });
        return;
      }
      var frame = this.__getFrameMetricsApprox(Math.floor(index), this.props);
      var offset = Math.max(0, this._getOffsetApprox(index, this.props) - (viewPosition || 0) * (this._scrollMetrics.visibleLength - frame.length)) - (viewOffset || 0);
      if (this._scrollRef == null) {
        return;
      }
      if (this._scrollRef.scrollTo == null) {
        console.warn('No scrollTo method provided. This may be because you have two nested ' + 'VirtualizedLists with the same orientation, or because you are ' + 'using a custom component that does not implement scrollTo.');
        return;
      }
      this._scrollRef.scrollTo(horizontal ? {
        x: offset,
        animated: animated
      } : {
        y: offset,
        animated: animated
      });
    }
  }, {
    key: "scrollToItem",
    value: function scrollToItem(params) {
      var item = params.item;
      var _this$props3 = this.props,
        data = _this$props3.data,
        getItem = _this$props3.getItem,
        getItemCount = _this$props3.getItemCount;
      var itemCount = getItemCount(data);
      for (var _index = 0; _index < itemCount; _index++) {
        if (getItem(data, _index) === item) {
          this.scrollToIndex(Object.assign({}, params, {
            index: _index
          }));
          break;
        }
      }
    }
  }, {
    key: "scrollToOffset",
    value: function scrollToOffset(params) {
      var animated = params.animated,
        offset = params.offset;
      if (this._scrollRef == null) {
        return;
      }
      if (this._scrollRef.scrollTo == null) {
        console.warn('No scrollTo method provided. This may be because you have two nested ' + 'VirtualizedLists with the same orientation, or because you are ' + 'using a custom component that does not implement scrollTo.');
        return;
      }
      this._scrollRef.scrollTo(horizontalOrDefault(this.props.horizontal) ? {
        x: offset,
        animated: animated
      } : {
        y: offset,
        animated: animated
      });
    }
  }, {
    key: "recordInteraction",
    value: function recordInteraction() {
      this._nestedChildLists.forEach(function (childList) {
        childList.recordInteraction();
      });
      this._viewabilityTuples.forEach(function (t) {
        t.viewabilityHelper.recordInteraction();
      });
      this._updateViewableItems(this.props, this.state.cellsAroundViewport);
    }
  }, {
    key: "flashScrollIndicators",
    value: function flashScrollIndicators() {
      if (this._scrollRef == null) {
        return;
      }
      this._scrollRef.flashScrollIndicators();
    }
  }, {
    key: "getScrollResponder",
    value: function getScrollResponder() {
      if (this._scrollRef && this._scrollRef.getScrollResponder) {
        return this._scrollRef.getScrollResponder();
      }
    }
  }, {
    key: "getScrollableNode",
    value: function getScrollableNode() {
      if (this._scrollRef && this._scrollRef.getScrollableNode) {
        return this._scrollRef.getScrollableNode();
      } else {
        return (0, _reactNative.findNodeHandle)(this._scrollRef);
      }
    }
  }, {
    key: "getScrollRef",
    value: function getScrollRef() {
      if (this._scrollRef && this._scrollRef.getScrollRef) {
        return this._scrollRef.getScrollRef();
      } else {
        return this._scrollRef;
      }
    }
  }, {
    key: "setNativeProps",
    value: function setNativeProps(props) {
      if (this._scrollRef) {
        this._scrollRef.setNativeProps(props);
      }
    }
  }, {
    key: "_getCellKey",
    value: function _getCellKey() {
      var _this$context;
      return ((_this$context = this.context) == null ? void 0 : _this$context.cellKey) || 'rootList';
    }
  }, {
    key: "hasMore",
    value: function hasMore() {
      return this._hasMore;
    }
  }, {
    key: "_checkProps",
    value: function _checkProps(props) {
      var onScroll = props.onScroll,
        windowSize = props.windowSize,
        getItemCount = props.getItemCount,
        data = props.data,
        initialScrollIndex = props.initialScrollIndex;
      (0, _invariant.default)(!onScroll || !onScroll.__isNative, 'Components based on VirtualizedList must be wrapped with Animated.createAnimatedComponent ' + 'to support native onScroll events with useNativeDriver');
      (0, _invariant.default)(windowSizeOrDefault(windowSize) > 0, 'VirtualizedList: The windowSize prop must be present and set to a value greater than 0.');
      (0, _invariant.default)(getItemCount, 'VirtualizedList: The "getItemCount" prop must be provided');
      var itemCount = getItemCount(data);
      if (initialScrollIndex != null && !this._hasTriggeredInitialScrollToIndex && (initialScrollIndex < 0 || itemCount > 0 && initialScrollIndex >= itemCount) && !this._hasWarned.initialScrollIndex) {
        console.warn(`initialScrollIndex "${initialScrollIndex}" is not valid (list has ${itemCount} items)`);
        this._hasWarned.initialScrollIndex = true;
      }
      if (__DEV__ && !this._hasWarned.flexWrap) {
        var flatStyles = _reactNative.StyleSheet.flatten(this.props.contentContainerStyle);
        if (flatStyles != null && flatStyles.flexWrap === 'wrap') {
          console.warn('`flexWrap: `wrap`` is not supported with the `VirtualizedList` components.' + 'Consider using `numColumns` with `FlatList` instead.');
          this._hasWarned.flexWrap = true;
        }
      }
    }
  }, {
    key: "_adjustCellsAroundViewport",
    value: function _adjustCellsAroundViewport(props, cellsAroundViewport, pendingScrollUpdateCount) {
      var data = props.data,
        getItemCount = props.getItemCount;
      var onEndReachedThreshold = onEndReachedThresholdOrDefault(props.onEndReachedThreshold);
      var _this$_scrollMetrics = this._scrollMetrics,
        contentLength = _this$_scrollMetrics.contentLength,
        offset = _this$_scrollMetrics.offset,
        visibleLength = _this$_scrollMetrics.visibleLength;
      var distanceFromEnd = contentLength - visibleLength - offset;
      if (visibleLength <= 0 || contentLength <= 0) {
        return cellsAroundViewport.last >= getItemCount(data) ? VirtualizedList._constrainToItemCount(cellsAroundViewport, props) : cellsAroundViewport;
      }
      var newCellsAroundViewport;
      if (props.disableVirtualization) {
        var renderAhead = distanceFromEnd < onEndReachedThreshold * visibleLength ? maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch) : 0;
        newCellsAroundViewport = {
          first: 0,
          last: Math.min(cellsAroundViewport.last + renderAhead, getItemCount(data) - 1)
        };
      } else {
        if (pendingScrollUpdateCount > 0) {
          return cellsAroundViewport.last >= getItemCount(data) ? VirtualizedList._constrainToItemCount(cellsAroundViewport, props) : cellsAroundViewport;
        }
        newCellsAroundViewport = (0, _VirtualizeUtils.computeWindowedRenderLimits)(props, maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch), windowSizeOrDefault(props.windowSize), cellsAroundViewport, this.__getFrameMetricsApprox, this._scrollMetrics);
        (0, _invariant.default)(newCellsAroundViewport.last < getItemCount(data), 'computeWindowedRenderLimits() should return range in-bounds');
      }
      if (this._nestedChildLists.size() > 0) {
        var childIdx = this._findFirstChildWithMore(newCellsAroundViewport.first, newCellsAroundViewport.last);
        newCellsAroundViewport.last = childIdx != null ? childIdx : newCellsAroundViewport.last;
      }
      return newCellsAroundViewport;
    }
  }, {
    key: "_findFirstChildWithMore",
    value: function _findFirstChildWithMore(first, last) {
      for (var ii = first; ii <= last; ii++) {
        var cellKeyForIndex = this._indicesToKeys.get(ii);
        if (cellKeyForIndex != null && this._nestedChildLists.anyInCell(cellKeyForIndex, function (childList) {
          return childList.hasMore();
        })) {
          return ii;
        }
      }
      return null;
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this._isNestedWithSameOrientation()) {
        this.context.registerAsNestedChild({
          ref: this,
          cellKey: this.context.cellKey
        });
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this._isNestedWithSameOrientation()) {
        this.context.unregisterAsNestedChild({
          ref: this
        });
      }
      this._updateCellsToRenderBatcher.dispose({
        abort: true
      });
      this._viewabilityTuples.forEach(function (tuple) {
        tuple.viewabilityHelper.dispose();
      });
      this._fillRateHelper.deactivateAndFlush();
    }
  }, {
    key: "_pushCells",
    value: function _pushCells(cells, stickyHeaderIndices, stickyIndicesFromProps, first, last, inversionStyle) {
      var _this2 = this;
      var _this$props4 = this.props,
        CellRendererComponent = _this$props4.CellRendererComponent,
        ItemSeparatorComponent = _this$props4.ItemSeparatorComponent,
        ListHeaderComponent = _this$props4.ListHeaderComponent,
        ListItemComponent = _this$props4.ListItemComponent,
        data = _this$props4.data,
        debug = _this$props4.debug,
        getItem = _this$props4.getItem,
        getItemCount = _this$props4.getItemCount,
        getItemLayout = _this$props4.getItemLayout,
        horizontal = _this$props4.horizontal,
        renderItem = _this$props4.renderItem;
      var stickyOffset = ListHeaderComponent ? 1 : 0;
      var end = getItemCount(data) - 1;
      var prevCellKey;
      last = Math.min(end, last);
      var _loop = function _loop() {
        var item = getItem(data, ii);
        var key = VirtualizedList._keyExtractor(item, ii, _this2.props);
        _this2._indicesToKeys.set(ii, key);
        if (stickyIndicesFromProps.has(ii + stickyOffset)) {
          stickyHeaderIndices.push(cells.length);
        }
        var shouldListenForLayout = getItemLayout == null || debug || _this2._fillRateHelper.enabled();
        cells.push((0, _jsxRuntime.jsx)(_VirtualizedListCellRenderer.default, Object.assign({
          CellRendererComponent: CellRendererComponent,
          ItemSeparatorComponent: ii < end ? ItemSeparatorComponent : undefined,
          ListItemComponent: ListItemComponent,
          cellKey: key,
          horizontal: horizontal,
          index: ii,
          inversionStyle: inversionStyle,
          item: item,
          prevCellKey: prevCellKey,
          onUpdateSeparators: _this2._onUpdateSeparators,
          onCellFocusCapture: function onCellFocusCapture(e) {
            return _this2._onCellFocusCapture(key);
          },
          onUnmount: _this2._onCellUnmount,
          ref: function ref(_ref) {
            _this2._cellRefs[key] = _ref;
          },
          renderItem: renderItem
        }, shouldListenForLayout && {
          onCellLayout: _this2._onCellLayout
        }), key));
        prevCellKey = key;
      };
      for (var ii = first; ii <= last; ii++) {
        _loop();
      }
    }
  }, {
    key: "_isNestedWithSameOrientation",
    value: function _isNestedWithSameOrientation() {
      var nestedContext = this.context;
      return !!(nestedContext && !!nestedContext.horizontal === horizontalOrDefault(this.props.horizontal));
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;
      this._checkProps(this.props);
      var _this$props5 = this.props,
        ListEmptyComponent = _this$props5.ListEmptyComponent,
        ListFooterComponent = _this$props5.ListFooterComponent,
        ListHeaderComponent = _this$props5.ListHeaderComponent;
      var _this$props6 = this.props,
        data = _this$props6.data,
        horizontal = _this$props6.horizontal;
      var inversionStyle = this.props.inverted ? horizontalOrDefault(this.props.horizontal) ? styles.horizontallyInverted : styles.verticallyInverted : null;
      var cells = [];
      var stickyIndicesFromProps = new Set(this.props.stickyHeaderIndices);
      var stickyHeaderIndices = [];
      if (ListHeaderComponent) {
        if (stickyIndicesFromProps.has(0)) {
          stickyHeaderIndices.push(0);
        }
        var _element = React.isValidElement(ListHeaderComponent) ? ListHeaderComponent : (0, _jsxRuntime.jsx)(ListHeaderComponent, {});
        cells.push((0, _jsxRuntime.jsx)(_VirtualizedListContext.VirtualizedListCellContextProvider, {
          cellKey: this._getCellKey() + '-header',
          children: (0, _jsxRuntime.jsx)(_reactNative.View, {
            collapsable: false,
            onLayout: this._onLayoutHeader,
            style: _reactNative.StyleSheet.compose(inversionStyle, this.props.ListHeaderComponentStyle),
            children: _element
          })
        }, "$header"));
      }
      var itemCount = this.props.getItemCount(data);
      if (itemCount === 0 && ListEmptyComponent) {
        var _element2 = React.isValidElement(ListEmptyComponent) ? ListEmptyComponent : (0, _jsxRuntime.jsx)(ListEmptyComponent, {});
        cells.push((0, _jsxRuntime.jsx)(_VirtualizedListContext.VirtualizedListCellContextProvider, {
          cellKey: this._getCellKey() + '-empty',
          children: React.cloneElement(_element2, {
            onLayout: function onLayout(event) {
              _this3._onLayoutEmpty(event);
              if (_element2.props.onLayout) {
                _element2.props.onLayout(event);
              }
            },
            style: _reactNative.StyleSheet.compose(inversionStyle, _element2.props.style)
          })
        }, "$empty"));
      }
      if (itemCount > 0) {
        _usedIndexForKey = false;
        _keylessItemComponentName = '';
        var spacerKey = this._getSpacerKey(!horizontal);
        var renderRegions = this.state.renderMask.enumerateRegions();
        var lastSpacer = findLastWhere(renderRegions, function (r) {
          return r.isSpacer;
        });
        for (var section of renderRegions) {
          if (section.isSpacer) {
            if (this.props.disableVirtualization) {
              continue;
            }
            var isLastSpacer = section === lastSpacer;
            var constrainToMeasured = isLastSpacer && !this.props.getItemLayout;
            var last = constrainToMeasured ? (0, _clamp.default)(section.first - 1, section.last, this._highestMeasuredFrameIndex) : section.last;
            var firstMetrics = this.__getFrameMetricsApprox(section.first, this.props);
            var lastMetrics = this.__getFrameMetricsApprox(last, this.props);
            var spacerSize = lastMetrics.offset + lastMetrics.length - firstMetrics.offset;
            cells.push((0, _jsxRuntime.jsx)(_reactNative.View, {
              style: (0, _defineProperty2.default)({}, spacerKey, spacerSize)
            }, `$spacer-${section.first}`));
          } else {
            this._pushCells(cells, stickyHeaderIndices, stickyIndicesFromProps, section.first, section.last, inversionStyle);
          }
        }
        if (!this._hasWarned.keys && _usedIndexForKey) {
          console.warn('VirtualizedList: missing keys for items, make sure to specify a key or id property on each ' + 'item or provide a custom keyExtractor.', _keylessItemComponentName);
          this._hasWarned.keys = true;
        }
      }
      if (ListFooterComponent) {
        var _element3 = React.isValidElement(ListFooterComponent) ? ListFooterComponent : (0, _jsxRuntime.jsx)(ListFooterComponent, {});
        cells.push((0, _jsxRuntime.jsx)(_VirtualizedListContext.VirtualizedListCellContextProvider, {
          cellKey: this._getFooterCellKey(),
          children: (0, _jsxRuntime.jsx)(_reactNative.View, {
            onLayout: this._onLayoutFooter,
            style: _reactNative.StyleSheet.compose(inversionStyle, this.props.ListFooterComponentStyle),
            children: _element3
          })
        }, "$footer"));
      }
      var scrollProps = Object.assign({}, this.props, {
        onContentSizeChange: this._onContentSizeChange,
        onLayout: this._onLayout,
        onScroll: this._onScroll,
        onScrollBeginDrag: this._onScrollBeginDrag,
        onScrollEndDrag: this._onScrollEndDrag,
        onMomentumScrollBegin: this._onMomentumScrollBegin,
        onMomentumScrollEnd: this._onMomentumScrollEnd,
        scrollEventThrottle: scrollEventThrottleOrDefault(this.props.scrollEventThrottle),
        invertStickyHeaders: this.props.invertStickyHeaders !== undefined ? this.props.invertStickyHeaders : this.props.inverted,
        stickyHeaderIndices: stickyHeaderIndices,
        style: inversionStyle ? [inversionStyle, this.props.style] : this.props.style,
        isInvertedVirtualizedList: this.props.inverted,
        maintainVisibleContentPosition: this.props.maintainVisibleContentPosition != null ? Object.assign({}, this.props.maintainVisibleContentPosition, {
          minIndexForVisible: this.props.maintainVisibleContentPosition.minIndexForVisible + (this.props.ListHeaderComponent ? 1 : 0)
        }) : undefined
      });
      this._hasMore = this.state.cellsAroundViewport.last < itemCount - 1;
      var innerRet = (0, _jsxRuntime.jsx)(_VirtualizedListContext.VirtualizedListContextProvider, {
        value: {
          cellKey: null,
          getScrollMetrics: this._getScrollMetrics,
          horizontal: horizontalOrDefault(this.props.horizontal),
          getOutermostParentListRef: this._getOutermostParentListRef,
          registerAsNestedChild: this._registerAsNestedChild,
          unregisterAsNestedChild: this._unregisterAsNestedChild
        },
        children: React.cloneElement((this.props.renderScrollComponent || this._defaultRenderScrollComponent)(scrollProps), {
          ref: this._captureScrollRef
        }, cells)
      });
      var ret = innerRet;
      if (__DEV__) {
        ret = (0, _jsxRuntime.jsx)(_reactNative.ScrollView.Context.Consumer, {
          children: function children(scrollContext) {
            if (scrollContext != null && !scrollContext.horizontal === !horizontalOrDefault(_this3.props.horizontal) && !_this3._hasWarned.nesting && _this3.context == null && _this3.props.scrollEnabled !== false) {
              console.error('VirtualizedLists should never be nested inside plain ScrollViews with the same ' + 'orientation because it can break windowing and other functionality - use another ' + 'VirtualizedList-backed container instead.');
              _this3._hasWarned.nesting = true;
            }
            return innerRet;
          }
        });
      }
      if (this.props.debug) {
        return (0, _jsxRuntime.jsxs)(_reactNative.View, {
          style: styles.debug,
          children: [ret, this._renderDebugOverlay()]
        });
      } else {
        return ret;
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      var _this$props7 = this.props,
        data = _this$props7.data,
        extraData = _this$props7.extraData;
      if (data !== prevProps.data || extraData !== prevProps.extraData) {
        this._viewabilityTuples.forEach(function (tuple) {
          tuple.viewabilityHelper.resetViewableIndices();
        });
      }
      var hiPriInProgress = this._hiPriInProgress;
      this._scheduleCellsToRenderUpdate();
      if (hiPriInProgress) {
        this._hiPriInProgress = false;
      }
    }
  }, {
    key: "_computeBlankness",
    value: function _computeBlankness() {
      this._fillRateHelper.computeBlankness(this.props, this.state.cellsAroundViewport, this._scrollMetrics);
    }
  }, {
    key: "_onCellFocusCapture",
    value: function _onCellFocusCapture(cellKey) {
      this._lastFocusedCellKey = cellKey;
      this._updateCellsToRender();
    }
  }, {
    key: "_triggerRemeasureForChildListsInCell",
    value: function _triggerRemeasureForChildListsInCell(cellKey) {
      this._nestedChildLists.forEachInCell(cellKey, function (childList) {
        childList.measureLayoutRelativeToContainingList();
      });
    }
  }, {
    key: "measureLayoutRelativeToContainingList",
    value: function measureLayoutRelativeToContainingList() {
      var _this4 = this;
      try {
        if (!this._scrollRef) {
          return;
        }
        this._scrollRef.measureLayout(this.context.getOutermostParentListRef().getScrollRef(), function (x, y, width, height) {
          _this4._offsetFromParentVirtualizedList = _this4._selectOffset({
            x: x,
            y: y
          });
          _this4._scrollMetrics.contentLength = _this4._selectLength({
            width: width,
            height: height
          });
          var scrollMetrics = _this4._convertParentScrollMetrics(_this4.context.getScrollMetrics());
          var metricsChanged = _this4._scrollMetrics.visibleLength !== scrollMetrics.visibleLength || _this4._scrollMetrics.offset !== scrollMetrics.offset;
          if (metricsChanged) {
            _this4._scrollMetrics.visibleLength = scrollMetrics.visibleLength;
            _this4._scrollMetrics.offset = scrollMetrics.offset;
            _this4._nestedChildLists.forEach(function (childList) {
              childList.measureLayoutRelativeToContainingList();
            });
          }
        }, function (error) {
          console.warn("VirtualizedList: Encountered an error while measuring a list's" + ' offset from its containing VirtualizedList.');
        });
      } catch (error) {
        console.warn('measureLayoutRelativeToContainingList threw an error', error.stack);
      }
    }
  }, {
    key: "_getFooterCellKey",
    value: function _getFooterCellKey() {
      return this._getCellKey() + '-footer';
    }
  }, {
    key: "_renderDebugOverlay",
    value: function _renderDebugOverlay() {
      var normalize = this._scrollMetrics.visibleLength / (this._scrollMetrics.contentLength || 1);
      var framesInLayout = [];
      var itemCount = this.props.getItemCount(this.props.data);
      for (var ii = 0; ii < itemCount; ii++) {
        var frame = this.__getFrameMetricsApprox(ii, this.props);
        if (frame.inLayout) {
          framesInLayout.push(frame);
        }
      }
      var windowTop = this.__getFrameMetricsApprox(this.state.cellsAroundViewport.first, this.props).offset;
      var frameLast = this.__getFrameMetricsApprox(this.state.cellsAroundViewport.last, this.props);
      var windowLen = frameLast.offset + frameLast.length - windowTop;
      var visTop = this._scrollMetrics.offset;
      var visLen = this._scrollMetrics.visibleLength;
      return (0, _jsxRuntime.jsxs)(_reactNative.View, {
        style: [styles.debugOverlayBase, styles.debugOverlay],
        children: [framesInLayout.map(function (f, ii) {
          return (0, _jsxRuntime.jsx)(_reactNative.View, {
            style: [styles.debugOverlayBase, styles.debugOverlayFrame, {
              top: f.offset * normalize,
              height: f.length * normalize
            }]
          }, 'f' + ii);
        }), (0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [styles.debugOverlayBase, styles.debugOverlayFrameLast, {
            top: windowTop * normalize,
            height: windowLen * normalize
          }]
        }), (0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [styles.debugOverlayBase, styles.debugOverlayFrameVis, {
            top: visTop * normalize,
            height: visLen * normalize
          }]
        })]
      });
    }
  }, {
    key: "_selectLength",
    value: function _selectLength(metrics) {
      return !horizontalOrDefault(this.props.horizontal) ? metrics.height : metrics.width;
    }
  }, {
    key: "_selectOffset",
    value: function _selectOffset(metrics) {
      return !horizontalOrDefault(this.props.horizontal) ? metrics.y : metrics.x;
    }
  }, {
    key: "_maybeCallOnEdgeReached",
    value: function _maybeCallOnEdgeReached() {
      var _this$props8 = this.props,
        data = _this$props8.data,
        getItemCount = _this$props8.getItemCount,
        onStartReached = _this$props8.onStartReached,
        onStartReachedThreshold = _this$props8.onStartReachedThreshold,
        onEndReached = _this$props8.onEndReached,
        onEndReachedThreshold = _this$props8.onEndReachedThreshold;
      if (this.state.pendingScrollUpdateCount > 0) {
        return;
      }
      var _this$_scrollMetrics2 = this._scrollMetrics,
        contentLength = _this$_scrollMetrics2.contentLength,
        visibleLength = _this$_scrollMetrics2.visibleLength,
        offset = _this$_scrollMetrics2.offset;
      var distanceFromStart = offset;
      var distanceFromEnd = contentLength - visibleLength - offset;
      if (distanceFromStart < ON_EDGE_REACHED_EPSILON) {
        distanceFromStart = 0;
      }
      if (distanceFromEnd < ON_EDGE_REACHED_EPSILON) {
        distanceFromEnd = 0;
      }
      var DEFAULT_THRESHOLD_PX = 2;
      var startThreshold = onStartReachedThreshold != null ? onStartReachedThreshold * visibleLength : DEFAULT_THRESHOLD_PX;
      var endThreshold = onEndReachedThreshold != null ? onEndReachedThreshold * visibleLength : DEFAULT_THRESHOLD_PX;
      var isWithinStartThreshold = distanceFromStart <= startThreshold;
      var isWithinEndThreshold = distanceFromEnd <= endThreshold;
      if (onEndReached && this.state.cellsAroundViewport.last === getItemCount(data) - 1 && isWithinEndThreshold && this._scrollMetrics.contentLength !== this._sentEndForContentLength) {
        this._sentEndForContentLength = this._scrollMetrics.contentLength;
        onEndReached({
          distanceFromEnd: distanceFromEnd
        });
      } else if (onStartReached != null && this.state.cellsAroundViewport.first === 0 && isWithinStartThreshold && this._scrollMetrics.contentLength !== this._sentStartForContentLength) {
        this._sentStartForContentLength = this._scrollMetrics.contentLength;
        onStartReached({
          distanceFromStart: distanceFromStart
        });
      } else {
        this._sentStartForContentLength = isWithinStartThreshold ? this._sentStartForContentLength : 0;
        this._sentEndForContentLength = isWithinEndThreshold ? this._sentEndForContentLength : 0;
      }
    }
  }, {
    key: "_scheduleCellsToRenderUpdate",
    value: function _scheduleCellsToRenderUpdate() {
      var _this$state$cellsArou = this.state.cellsAroundViewport,
        first = _this$state$cellsArou.first,
        last = _this$state$cellsArou.last;
      var _this$_scrollMetrics3 = this._scrollMetrics,
        offset = _this$_scrollMetrics3.offset,
        visibleLength = _this$_scrollMetrics3.visibleLength,
        velocity = _this$_scrollMetrics3.velocity;
      var itemCount = this.props.getItemCount(this.props.data);
      var hiPri = false;
      var onStartReachedThreshold = onStartReachedThresholdOrDefault(this.props.onStartReachedThreshold);
      var onEndReachedThreshold = onEndReachedThresholdOrDefault(this.props.onEndReachedThreshold);
      if (first > 0) {
        var distTop = offset - this.__getFrameMetricsApprox(first, this.props).offset;
        hiPri = distTop < 0 || velocity < -2 && distTop < getScrollingThreshold(onStartReachedThreshold, visibleLength);
      }
      if (!hiPri && last >= 0 && last < itemCount - 1) {
        var distBottom = this.__getFrameMetricsApprox(last, this.props).offset - (offset + visibleLength);
        hiPri = distBottom < 0 || velocity > 2 && distBottom < getScrollingThreshold(onEndReachedThreshold, visibleLength);
      }
      if (hiPri && (this._averageCellLength || this.props.getItemLayout) && !this._hiPriInProgress) {
        this._hiPriInProgress = true;
        this._updateCellsToRenderBatcher.dispose({
          abort: true
        });
        this._updateCellsToRender();
        return;
      } else {
        this._updateCellsToRenderBatcher.schedule();
      }
    }
  }, {
    key: "_updateViewableItems",
    value: function _updateViewableItems(props, cellsAroundViewport) {
      var _this5 = this;
      if (this.state.pendingScrollUpdateCount > 0) {
        return;
      }
      this._viewabilityTuples.forEach(function (tuple) {
        tuple.viewabilityHelper.onUpdate(props, _this5._scrollMetrics.offset, _this5._scrollMetrics.visibleLength, _this5._getFrameMetrics, _this5._createViewToken, tuple.onViewableItemsChanged, cellsAroundViewport);
      });
    }
  }], [{
    key: "_findItemIndexWithKey",
    value: function _findItemIndexWithKey(props, key, hint) {
      var itemCount = props.getItemCount(props.data);
      if (hint != null && hint >= 0 && hint < itemCount) {
        var curKey = VirtualizedList._getItemKey(props, hint);
        if (curKey === key) {
          return hint;
        }
      }
      for (var ii = 0; ii < itemCount; ii++) {
        var _curKey = VirtualizedList._getItemKey(props, ii);
        if (_curKey === key) {
          return ii;
        }
      }
      return null;
    }
  }, {
    key: "_getItemKey",
    value: function _getItemKey(props, index) {
      var item = props.getItem(props.data, index);
      return VirtualizedList._keyExtractor(item, index, props);
    }
  }, {
    key: "_createRenderMask",
    value: function _createRenderMask(props, cellsAroundViewport, additionalRegions) {
      var itemCount = props.getItemCount(props.data);
      (0, _invariant.default)(cellsAroundViewport.first >= 0 && cellsAroundViewport.last >= cellsAroundViewport.first - 1 && cellsAroundViewport.last < itemCount, `Invalid cells around viewport "[${cellsAroundViewport.first}, ${cellsAroundViewport.last}]" was passed to VirtualizedList._createRenderMask`);
      var renderMask = new _CellRenderMask.CellRenderMask(itemCount);
      if (itemCount > 0) {
        var allRegions = [cellsAroundViewport].concat((0, _toConsumableArray2.default)(additionalRegions != null ? additionalRegions : []));
        for (var region of allRegions) {
          renderMask.addCells(region);
        }
        if (props.initialScrollIndex == null || props.initialScrollIndex <= 0) {
          var initialRegion = VirtualizedList._initialRenderRegion(props);
          renderMask.addCells(initialRegion);
        }
        var stickyIndicesSet = new Set(props.stickyHeaderIndices);
        VirtualizedList._ensureClosestStickyHeader(props, stickyIndicesSet, renderMask, cellsAroundViewport.first);
      }
      return renderMask;
    }
  }, {
    key: "_initialRenderRegion",
    value: function _initialRenderRegion(props) {
      var _props$initialScrollI;
      var itemCount = props.getItemCount(props.data);
      var firstCellIndex = Math.max(0, Math.min(itemCount - 1, Math.floor((_props$initialScrollI = props.initialScrollIndex) != null ? _props$initialScrollI : 0)));
      var lastCellIndex = Math.min(itemCount, firstCellIndex + initialNumToRenderOrDefault(props.initialNumToRender)) - 1;
      return {
        first: firstCellIndex,
        last: lastCellIndex
      };
    }
  }, {
    key: "_ensureClosestStickyHeader",
    value: function _ensureClosestStickyHeader(props, stickyIndicesSet, renderMask, cellIdx) {
      var stickyOffset = props.ListHeaderComponent ? 1 : 0;
      for (var itemIdx = cellIdx - 1; itemIdx >= 0; itemIdx--) {
        if (stickyIndicesSet.has(itemIdx + stickyOffset)) {
          renderMask.addCells({
            first: itemIdx,
            last: itemIdx
          });
          break;
        }
      }
    }
  }, {
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(newProps, prevState) {
      var _newProps$maintainVis, _newProps$maintainVis2;
      var itemCount = newProps.getItemCount(newProps.data);
      if (itemCount === prevState.renderMask.numCells()) {
        return prevState;
      }
      var maintainVisibleContentPositionAdjustment = null;
      var prevFirstVisibleItemKey = prevState.firstVisibleItemKey;
      var minIndexForVisible = (_newProps$maintainVis = (_newProps$maintainVis2 = newProps.maintainVisibleContentPosition) == null ? void 0 : _newProps$maintainVis2.minIndexForVisible) != null ? _newProps$maintainVis : 0;
      var newFirstVisibleItemKey = newProps.getItemCount(newProps.data) > minIndexForVisible ? VirtualizedList._getItemKey(newProps, minIndexForVisible) : null;
      if (newProps.maintainVisibleContentPosition != null && prevFirstVisibleItemKey != null && newFirstVisibleItemKey != null) {
        if (newFirstVisibleItemKey !== prevFirstVisibleItemKey) {
          var hint = itemCount - prevState.renderMask.numCells() + minIndexForVisible;
          var firstVisibleItemIndex = VirtualizedList._findItemIndexWithKey(newProps, prevFirstVisibleItemKey, hint);
          maintainVisibleContentPositionAdjustment = firstVisibleItemIndex != null ? firstVisibleItemIndex - minIndexForVisible : null;
        } else {
          maintainVisibleContentPositionAdjustment = null;
        }
      }
      var constrainedCells = VirtualizedList._constrainToItemCount(maintainVisibleContentPositionAdjustment != null ? {
        first: prevState.cellsAroundViewport.first + maintainVisibleContentPositionAdjustment,
        last: prevState.cellsAroundViewport.last + maintainVisibleContentPositionAdjustment
      } : prevState.cellsAroundViewport, newProps);
      return {
        cellsAroundViewport: constrainedCells,
        renderMask: VirtualizedList._createRenderMask(newProps, constrainedCells),
        firstVisibleItemKey: newFirstVisibleItemKey,
        pendingScrollUpdateCount: maintainVisibleContentPositionAdjustment != null ? prevState.pendingScrollUpdateCount + 1 : prevState.pendingScrollUpdateCount
      };
    }
  }, {
    key: "_constrainToItemCount",
    value: function _constrainToItemCount(cells, props) {
      var itemCount = props.getItemCount(props.data);
      var last = Math.min(itemCount - 1, cells.last);
      var maxToRenderPerBatch = maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch);
      return {
        first: (0, _clamp.default)(0, itemCount - 1 - maxToRenderPerBatch, cells.first),
        last: last
      };
    }
  }, {
    key: "_keyExtractor",
    value: function _keyExtractor(item, index, props) {
      if (props.keyExtractor != null) {
        return props.keyExtractor(item, index);
      }
      var key = (0, _VirtualizeUtils.keyExtractor)(item, index);
      if (key === String(index)) {
        _usedIndexForKey = true;
        if (item.type && item.type.displayName) {
          _keylessItemComponentName = item.type.displayName;
        }
      }
      return key;
    }
  }]);
  return VirtualizedList;
}(_StateSafePureComponent.default);
VirtualizedList.contextType = _VirtualizedListContext.VirtualizedListContext;
var styles = _reactNative.StyleSheet.create({
  verticallyInverted: _reactNative.Platform.OS === 'android' ? {
    transform: [{
      scale: -1
    }]
  } : {
    transform: [{
      scaleY: -1
    }]
  },
  horizontallyInverted: {
    transform: [{
      scaleX: -1
    }]
  },
  debug: {
    flex: 1
  },
  debugOverlayBase: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  debugOverlay: {
    bottom: 0,
    width: 20,
    borderColor: 'blue',
    borderWidth: 1
  },
  debugOverlayFrame: {
    left: 0,
    backgroundColor: 'orange'
  },
  debugOverlayFrameLast: {
    left: 0,
    borderColor: 'green',
    borderWidth: 2
  },
  debugOverlayFrameVis: {
    left: 0,
    borderColor: 'red',
    borderWidth: 2
  }
});
module.exports = VirtualizedList;