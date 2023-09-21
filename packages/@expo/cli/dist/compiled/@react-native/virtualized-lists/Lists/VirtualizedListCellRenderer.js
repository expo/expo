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
var _reactNative = require("react-native");
var _VirtualizedListContext = require("./VirtualizedListContext.js");
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var CellRenderer = function (_React$Component) {
  (0, _inherits2.default)(CellRenderer, _React$Component);
  var _super = _createSuper(CellRenderer);
  function CellRenderer() {
    var _this;
    (0, _classCallCheck2.default)(this, CellRenderer);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.state = {
      separatorProps: {
        highlighted: false,
        leadingItem: _this.props.item
      }
    };
    _this._separators = {
      highlight: function highlight() {
        var _this$props = _this.props,
          cellKey = _this$props.cellKey,
          prevCellKey = _this$props.prevCellKey;
        _this.props.onUpdateSeparators([cellKey, prevCellKey], {
          highlighted: true
        });
      },
      unhighlight: function unhighlight() {
        var _this$props2 = _this.props,
          cellKey = _this$props2.cellKey,
          prevCellKey = _this$props2.prevCellKey;
        _this.props.onUpdateSeparators([cellKey, prevCellKey], {
          highlighted: false
        });
      },
      updateProps: function updateProps(select, newProps) {
        var _this$props3 = _this.props,
          cellKey = _this$props3.cellKey,
          prevCellKey = _this$props3.prevCellKey;
        _this.props.onUpdateSeparators([select === 'leading' ? prevCellKey : cellKey], newProps);
      }
    };
    _this._onLayout = function (nativeEvent) {
      _this.props.onCellLayout && _this.props.onCellLayout(nativeEvent, _this.props.cellKey, _this.props.index);
    };
    return _this;
  }
  (0, _createClass2.default)(CellRenderer, [{
    key: "updateSeparatorProps",
    value: function updateSeparatorProps(newProps) {
      this.setState(function (state) {
        return {
          separatorProps: Object.assign({}, state.separatorProps, newProps)
        };
      });
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.props.onUnmount(this.props.cellKey);
    }
  }, {
    key: "_renderElement",
    value: function _renderElement(renderItem, ListItemComponent, item, index) {
      if (renderItem && ListItemComponent) {
        console.warn('VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take' + ' precedence over renderItem.');
      }
      if (ListItemComponent) {
        return React.createElement(ListItemComponent, {
          item: item,
          index: index,
          separators: this._separators
        });
      }
      if (renderItem) {
        return renderItem({
          item: item,
          index: index,
          separators: this._separators
        });
      }
      (0, _invariant.default)(false, 'VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.');
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props4 = this.props,
        CellRendererComponent = _this$props4.CellRendererComponent,
        ItemSeparatorComponent = _this$props4.ItemSeparatorComponent,
        ListItemComponent = _this$props4.ListItemComponent,
        cellKey = _this$props4.cellKey,
        horizontal = _this$props4.horizontal,
        item = _this$props4.item,
        index = _this$props4.index,
        inversionStyle = _this$props4.inversionStyle,
        onCellFocusCapture = _this$props4.onCellFocusCapture,
        onCellLayout = _this$props4.onCellLayout,
        renderItem = _this$props4.renderItem;
      var element = this._renderElement(renderItem, ListItemComponent, item, index);
      var itemSeparator = React.isValidElement(ItemSeparatorComponent) ? ItemSeparatorComponent : ItemSeparatorComponent && (0, _jsxRuntime.jsx)(ItemSeparatorComponent, Object.assign({}, this.state.separatorProps));
      var cellStyle = inversionStyle ? horizontal ? [styles.rowReverse, inversionStyle] : [styles.columnReverse, inversionStyle] : horizontal ? [styles.row, inversionStyle] : inversionStyle;
      var result = !CellRendererComponent ? (0, _jsxRuntime.jsxs)(_reactNative.View, Object.assign({
        style: cellStyle,
        onFocusCapture: onCellFocusCapture
      }, onCellLayout && {
        onLayout: this._onLayout
      }, {
        children: [element, itemSeparator]
      })) : (0, _jsxRuntime.jsxs)(CellRendererComponent, Object.assign({
        cellKey: cellKey,
        index: index,
        item: item,
        style: cellStyle,
        onFocusCapture: onCellFocusCapture
      }, onCellLayout && {
        onLayout: this._onLayout
      }, {
        children: [element, itemSeparator]
      }));
      return (0, _jsxRuntime.jsx)(_VirtualizedListContext.VirtualizedListCellContextProvider, {
        cellKey: this.props.cellKey,
        children: result
      });
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(props, prevState) {
      return {
        separatorProps: Object.assign({}, prevState.separatorProps, {
          leadingItem: props.item
        })
      };
    }
  }]);
  return CellRenderer;
}(React.Component);
exports.default = CellRenderer;
var styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row'
  },
  rowReverse: {
    flexDirection: 'row-reverse'
  },
  columnReverse: {
    flexDirection: 'column-reverse'
  }
});