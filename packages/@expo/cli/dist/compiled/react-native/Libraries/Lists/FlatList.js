var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _virtualizedLists = require("@react-native/virtualized-lists");
var _memoizeOne = _interopRequireDefault(require("memoize-one"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["numColumns", "columnWrapperStyle", "removeClippedSubviews", "strictMode"];
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var View = require("../Components/View/View");
var StyleSheet = require("../StyleSheet/StyleSheet");
var deepDiffer = require("../Utilities/differ/deepDiffer");
var Platform = require("../Utilities/Platform");
var invariant = require('invariant');
var React = require('react');
function removeClippedSubviewsOrDefault(removeClippedSubviews) {
  return removeClippedSubviews != null ? removeClippedSubviews : Platform.OS === 'android';
}
function numColumnsOrDefault(numColumns) {
  return numColumns != null ? numColumns : 1;
}
function isArrayLike(data) {
  return typeof Object(data).length === 'number';
}
var FlatList = function (_React$PureComponent) {
  (0, _inherits2.default)(FlatList, _React$PureComponent);
  var _super = _createSuper(FlatList);
  function FlatList(_props) {
    var _this;
    (0, _classCallCheck2.default)(this, FlatList);
    _this = _super.call(this, _props);
    _this._virtualizedListPairs = [];
    _this._captureRef = function (ref) {
      _this._listRef = ref;
    };
    _this._getItem = function (data, index) {
      var numColumns = numColumnsOrDefault(_this.props.numColumns);
      if (numColumns > 1) {
        var ret = [];
        for (var kk = 0; kk < numColumns; kk++) {
          var itemIndex = index * numColumns + kk;
          if (itemIndex < data.length) {
            var _item = data[itemIndex];
            ret.push(_item);
          }
        }
        return ret;
      } else {
        return data[index];
      }
    };
    _this._getItemCount = function (data) {
      if (data != null && isArrayLike(data)) {
        var numColumns = numColumnsOrDefault(_this.props.numColumns);
        return numColumns > 1 ? Math.ceil(data.length / numColumns) : data.length;
      } else {
        return 0;
      }
    };
    _this._keyExtractor = function (items, index) {
      var _this$props$keyExtrac;
      var numColumns = numColumnsOrDefault(_this.props.numColumns);
      var keyExtractor = (_this$props$keyExtrac = _this.props.keyExtractor) != null ? _this$props$keyExtrac : _virtualizedLists.keyExtractor;
      if (numColumns > 1) {
        invariant(Array.isArray(items), 'FlatList: Encountered internal consistency error, expected each item to consist of an ' + 'array with 1-%s columns; instead, received a single item.', numColumns);
        return items.map(function (item, kk) {
          return keyExtractor(item, index * numColumns + kk);
        }).join(':');
      }
      return keyExtractor(items, index);
    };
    _this._renderer = function (ListItemComponent, renderItem, columnWrapperStyle, numColumns, extraData) {
      var cols = numColumnsOrDefault(numColumns);
      var render = function render(props) {
        if (ListItemComponent) {
          return (0, _jsxRuntime.jsx)(ListItemComponent, Object.assign({}, props));
        } else if (renderItem) {
          return renderItem(props);
        } else {
          return null;
        }
      };
      var renderProp = function renderProp(info) {
        if (cols > 1) {
          var _item2 = info.item,
            _index = info.index;
          invariant(Array.isArray(_item2), 'Expected array of items with numColumns > 1');
          return (0, _jsxRuntime.jsx)(View, {
            style: StyleSheet.compose(styles.row, columnWrapperStyle),
            children: _item2.map(function (it, kk) {
              var element = render({
                item: it,
                index: _index * cols + kk,
                separators: info.separators
              });
              return element != null ? (0, _jsxRuntime.jsx)(React.Fragment, {
                children: element
              }, kk) : null;
            })
          });
        } else {
          return render(info);
        }
      };
      return ListItemComponent ? {
        ListItemComponent: renderProp
      } : {
        renderItem: renderProp
      };
    };
    _this._memoizedRenderer = (0, _memoizeOne.default)(_this._renderer);
    _this._checkProps(_this.props);
    if (_this.props.viewabilityConfigCallbackPairs) {
      _this._virtualizedListPairs = _this.props.viewabilityConfigCallbackPairs.map(function (pair) {
        return {
          viewabilityConfig: pair.viewabilityConfig,
          onViewableItemsChanged: _this._createOnViewableItemsChanged(pair.onViewableItemsChanged)
        };
      });
    } else if (_this.props.onViewableItemsChanged) {
      _this._virtualizedListPairs.push({
        viewabilityConfig: _this.props.viewabilityConfig,
        onViewableItemsChanged: _this._createOnViewableItemsChanged(_this.props.onViewableItemsChanged)
      });
    }
    return _this;
  }
  (0, _createClass2.default)(FlatList, [{
    key: "scrollToEnd",
    value: function scrollToEnd(params) {
      if (this._listRef) {
        this._listRef.scrollToEnd(params);
      }
    }
  }, {
    key: "scrollToIndex",
    value: function scrollToIndex(params) {
      if (this._listRef) {
        this._listRef.scrollToIndex(params);
      }
    }
  }, {
    key: "scrollToItem",
    value: function scrollToItem(params) {
      if (this._listRef) {
        this._listRef.scrollToItem(params);
      }
    }
  }, {
    key: "scrollToOffset",
    value: function scrollToOffset(params) {
      if (this._listRef) {
        this._listRef.scrollToOffset(params);
      }
    }
  }, {
    key: "recordInteraction",
    value: function recordInteraction() {
      if (this._listRef) {
        this._listRef.recordInteraction();
      }
    }
  }, {
    key: "flashScrollIndicators",
    value: function flashScrollIndicators() {
      if (this._listRef) {
        this._listRef.flashScrollIndicators();
      }
    }
  }, {
    key: "getScrollResponder",
    value: function getScrollResponder() {
      if (this._listRef) {
        return this._listRef.getScrollResponder();
      }
    }
  }, {
    key: "getNativeScrollRef",
    value: function getNativeScrollRef() {
      if (this._listRef) {
        return this._listRef.getScrollRef();
      }
    }
  }, {
    key: "getScrollableNode",
    value: function getScrollableNode() {
      if (this._listRef) {
        return this._listRef.getScrollableNode();
      }
    }
  }, {
    key: "setNativeProps",
    value: function setNativeProps(props) {
      if (this._listRef) {
        this._listRef.setNativeProps(props);
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      invariant(prevProps.numColumns === this.props.numColumns, 'Changing numColumns on the fly is not supported. Change the key prop on FlatList when ' + 'changing the number of columns to force a fresh render of the component.');
      invariant(prevProps.onViewableItemsChanged === this.props.onViewableItemsChanged, 'Changing onViewableItemsChanged on the fly is not supported');
      invariant(!deepDiffer(prevProps.viewabilityConfig, this.props.viewabilityConfig), 'Changing viewabilityConfig on the fly is not supported');
      invariant(prevProps.viewabilityConfigCallbackPairs === this.props.viewabilityConfigCallbackPairs, 'Changing viewabilityConfigCallbackPairs on the fly is not supported');
      this._checkProps(this.props);
    }
  }, {
    key: "_checkProps",
    value: function _checkProps(props) {
      var getItem = props.getItem,
        getItemCount = props.getItemCount,
        horizontal = props.horizontal,
        columnWrapperStyle = props.columnWrapperStyle,
        onViewableItemsChanged = props.onViewableItemsChanged,
        viewabilityConfigCallbackPairs = props.viewabilityConfigCallbackPairs;
      var numColumns = numColumnsOrDefault(this.props.numColumns);
      invariant(!getItem && !getItemCount, 'FlatList does not support custom data formats.');
      if (numColumns > 1) {
        invariant(!horizontal, 'numColumns does not support horizontal.');
      } else {
        invariant(!columnWrapperStyle, 'columnWrapperStyle not supported for single column lists');
      }
      invariant(!(onViewableItemsChanged && viewabilityConfigCallbackPairs), 'FlatList does not support setting both onViewableItemsChanged and ' + 'viewabilityConfigCallbackPairs.');
    }
  }, {
    key: "_pushMultiColumnViewable",
    value: function _pushMultiColumnViewable(arr, v) {
      var _this$props$keyExtrac2;
      var numColumns = numColumnsOrDefault(this.props.numColumns);
      var keyExtractor = (_this$props$keyExtrac2 = this.props.keyExtractor) != null ? _this$props$keyExtrac2 : _virtualizedLists.keyExtractor;
      v.item.forEach(function (item, ii) {
        invariant(v.index != null, 'Missing index!');
        var index = v.index * numColumns + ii;
        arr.push(Object.assign({}, v, {
          item: item,
          key: keyExtractor(item, index),
          index: index
        }));
      });
    }
  }, {
    key: "_createOnViewableItemsChanged",
    value: function _createOnViewableItemsChanged(onViewableItemsChanged) {
      var _this2 = this;
      return function (info) {
        var numColumns = numColumnsOrDefault(_this2.props.numColumns);
        if (onViewableItemsChanged) {
          if (numColumns > 1) {
            var changed = [];
            var viewableItems = [];
            info.viewableItems.forEach(function (v) {
              return _this2._pushMultiColumnViewable(viewableItems, v);
            });
            info.changed.forEach(function (v) {
              return _this2._pushMultiColumnViewable(changed, v);
            });
            onViewableItemsChanged({
              viewableItems: viewableItems,
              changed: changed
            });
          } else {
            onViewableItemsChanged(info);
          }
        }
      };
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
        numColumns = _this$props.numColumns,
        columnWrapperStyle = _this$props.columnWrapperStyle,
        _removeClippedSubviews = _this$props.removeClippedSubviews,
        _this$props$strictMod = _this$props.strictMode,
        strictMode = _this$props$strictMod === void 0 ? false : _this$props$strictMod,
        restProps = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      var renderer = strictMode ? this._memoizedRenderer : this._renderer;
      return (0, _jsxRuntime.jsx)(_virtualizedLists.VirtualizedList, Object.assign({}, restProps, {
        getItem: this._getItem,
        getItemCount: this._getItemCount,
        keyExtractor: this._keyExtractor,
        ref: this._captureRef,
        viewabilityConfigCallbackPairs: this._virtualizedListPairs,
        removeClippedSubviews: removeClippedSubviewsOrDefault(_removeClippedSubviews)
      }, renderer(this.props.ListItemComponent, this.props.renderItem, columnWrapperStyle, numColumns, this.props.extraData)));
    }
  }]);
  return FlatList;
}(React.PureComponent);
var styles = StyleSheet.create({
  row: {
    flexDirection: 'row'
  }
});
module.exports = FlatList;
//# sourceMappingURL=FlatList.js.map