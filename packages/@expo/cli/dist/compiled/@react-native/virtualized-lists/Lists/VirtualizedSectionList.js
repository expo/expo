var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _reactNative = require("react-native");
var _VirtualizedList = _interopRequireDefault(require("./VirtualizedList"));
var _VirtualizeUtils = require("./VirtualizeUtils");
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["ItemSeparatorComponent", "SectionSeparatorComponent", "renderItem", "renderSectionFooter", "renderSectionHeader", "sections", "stickySectionHeadersEnabled"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var VirtualizedSectionList = function (_React$PureComponent) {
  (0, _inherits2.default)(VirtualizedSectionList, _React$PureComponent);
  var _super = _createSuper(VirtualizedSectionList);
  function VirtualizedSectionList() {
    var _this;
    (0, _classCallCheck2.default)(this, VirtualizedSectionList);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._keyExtractor = function (item, index) {
      var info = _this._subExtractor(index);
      return info && info.key || String(index);
    };
    _this._convertViewable = function (viewable) {
      var _info$index;
      (0, _invariant.default)(viewable.index != null, 'Received a broken ViewToken');
      var info = _this._subExtractor(viewable.index);
      if (!info) {
        return null;
      }
      var keyExtractorWithNullableIndex = info.section.keyExtractor;
      var keyExtractorWithNonNullableIndex = _this.props.keyExtractor || _VirtualizeUtils.keyExtractor;
      var key = keyExtractorWithNullableIndex != null ? keyExtractorWithNullableIndex(viewable.item, info.index) : keyExtractorWithNonNullableIndex(viewable.item, (_info$index = info.index) != null ? _info$index : 0);
      return Object.assign({}, viewable, {
        index: info.index,
        key: key,
        section: info.section
      });
    };
    _this._onViewableItemsChanged = function (_ref) {
      var viewableItems = _ref.viewableItems,
        changed = _ref.changed;
      var onViewableItemsChanged = _this.props.onViewableItemsChanged;
      if (onViewableItemsChanged != null) {
        onViewableItemsChanged({
          viewableItems: viewableItems.map(_this._convertViewable, (0, _assertThisInitialized2.default)(_this)).filter(Boolean),
          changed: changed.map(_this._convertViewable, (0, _assertThisInitialized2.default)(_this)).filter(Boolean)
        });
      }
    };
    _this._renderItem = function (listItemCount) {
      return function (_ref2) {
        var item = _ref2.item,
          index = _ref2.index;
        var info = _this._subExtractor(index);
        if (!info) {
          return null;
        }
        var infoIndex = info.index;
        if (infoIndex == null) {
          var section = info.section;
          if (info.header === true) {
            var renderSectionHeader = _this.props.renderSectionHeader;
            return renderSectionHeader ? renderSectionHeader({
              section: section
            }) : null;
          } else {
            var renderSectionFooter = _this.props.renderSectionFooter;
            return renderSectionFooter ? renderSectionFooter({
              section: section
            }) : null;
          }
        } else {
          var renderItem = info.section.renderItem || _this.props.renderItem;
          var SeparatorComponent = _this._getSeparatorComponent(index, info, listItemCount);
          (0, _invariant.default)(renderItem, 'no renderItem!');
          return (0, _jsxRuntime.jsx)(ItemWithSeparator, {
            SeparatorComponent: SeparatorComponent,
            LeadingSeparatorComponent: infoIndex === 0 ? _this.props.SectionSeparatorComponent : undefined,
            cellKey: info.key,
            index: infoIndex,
            item: item,
            leadingItem: info.leadingItem,
            leadingSection: info.leadingSection,
            prevCellKey: (_this._subExtractor(index - 1) || {}).key,
            setSelfHighlightCallback: _this._setUpdateHighlightFor,
            setSelfUpdatePropsCallback: _this._setUpdatePropsFor,
            updateHighlightFor: _this._updateHighlightFor,
            updatePropsFor: _this._updatePropsFor,
            renderItem: renderItem,
            section: info.section,
            trailingItem: info.trailingItem,
            trailingSection: info.trailingSection,
            inverted: !!_this.props.inverted
          });
        }
      };
    };
    _this._updatePropsFor = function (cellKey, value) {
      var updateProps = _this._updatePropsMap[cellKey];
      if (updateProps != null) {
        updateProps(value);
      }
    };
    _this._updateHighlightFor = function (cellKey, value) {
      var updateHighlight = _this._updateHighlightMap[cellKey];
      if (updateHighlight != null) {
        updateHighlight(value);
      }
    };
    _this._setUpdateHighlightFor = function (cellKey, updateHighlightFn) {
      if (updateHighlightFn != null) {
        _this._updateHighlightMap[cellKey] = updateHighlightFn;
      } else {
        delete _this._updateHighlightFor[cellKey];
      }
    };
    _this._setUpdatePropsFor = function (cellKey, updatePropsFn) {
      if (updatePropsFn != null) {
        _this._updatePropsMap[cellKey] = updatePropsFn;
      } else {
        delete _this._updatePropsMap[cellKey];
      }
    };
    _this._updateHighlightMap = {};
    _this._updatePropsMap = {};
    _this._captureRef = function (ref) {
      _this._listRef = ref;
    };
    return _this;
  }
  (0, _createClass2.default)(VirtualizedSectionList, [{
    key: "scrollToLocation",
    value: function scrollToLocation(params) {
      var index = params.itemIndex;
      for (var i = 0; i < params.sectionIndex; i++) {
        index += this.props.getItemCount(this.props.sections[i].data) + 2;
      }
      var viewOffset = params.viewOffset || 0;
      if (this._listRef == null) {
        return;
      }
      if (params.itemIndex > 0 && this.props.stickySectionHeadersEnabled) {
        var frame = this._listRef.__getFrameMetricsApprox(index - params.itemIndex, this._listRef.props);
        viewOffset += frame.length;
      }
      var toIndexParams = Object.assign({}, params, {
        viewOffset: viewOffset,
        index: index
      });
      this._listRef.scrollToIndex(toIndexParams);
    }
  }, {
    key: "getListRef",
    value: function getListRef() {
      return this._listRef;
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;
      var _this$props = this.props,
        ItemSeparatorComponent = _this$props.ItemSeparatorComponent,
        SectionSeparatorComponent = _this$props.SectionSeparatorComponent,
        _renderItem = _this$props.renderItem,
        renderSectionFooter = _this$props.renderSectionFooter,
        renderSectionHeader = _this$props.renderSectionHeader,
        _sections = _this$props.sections,
        stickySectionHeadersEnabled = _this$props.stickySectionHeadersEnabled,
        passThroughProps = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      var listHeaderOffset = this.props.ListHeaderComponent ? 1 : 0;
      var stickyHeaderIndices = this.props.stickySectionHeadersEnabled ? [] : undefined;
      var itemCount = 0;
      for (var section of this.props.sections) {
        if (stickyHeaderIndices != null) {
          stickyHeaderIndices.push(itemCount + listHeaderOffset);
        }
        itemCount += 2;
        itemCount += this.props.getItemCount(section.data);
      }
      var renderItem = this._renderItem(itemCount);
      return (0, _jsxRuntime.jsx)(_VirtualizedList.default, Object.assign({}, passThroughProps, {
        keyExtractor: this._keyExtractor,
        stickyHeaderIndices: stickyHeaderIndices,
        renderItem: renderItem,
        data: this.props.sections,
        getItem: function getItem(sections, index) {
          return _this2._getItem(_this2.props, sections, index);
        },
        getItemCount: function getItemCount() {
          return itemCount;
        },
        onViewableItemsChanged: this.props.onViewableItemsChanged ? this._onViewableItemsChanged : undefined,
        ref: this._captureRef
      }));
    }
  }, {
    key: "_getItem",
    value: function _getItem(props, sections, index) {
      if (!sections) {
        return null;
      }
      var itemIdx = index - 1;
      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var sectionData = section.data;
        var itemCount = props.getItemCount(sectionData);
        if (itemIdx === -1 || itemIdx === itemCount) {
          return section;
        } else if (itemIdx < itemCount) {
          return props.getItem(sectionData, itemIdx);
        } else {
          itemIdx -= itemCount + 2;
        }
      }
      return null;
    }
  }, {
    key: "_subExtractor",
    value: function _subExtractor(index) {
      var itemIndex = index;
      var _this$props2 = this.props,
        getItem = _this$props2.getItem,
        getItemCount = _this$props2.getItemCount,
        keyExtractor = _this$props2.keyExtractor,
        sections = _this$props2.sections;
      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var sectionData = section.data;
        var key = section.key || String(i);
        itemIndex -= 1;
        if (itemIndex >= getItemCount(sectionData) + 1) {
          itemIndex -= getItemCount(sectionData) + 1;
        } else if (itemIndex === -1) {
          return {
            section: section,
            key: key + ':header',
            index: null,
            header: true,
            trailingSection: sections[i + 1]
          };
        } else if (itemIndex === getItemCount(sectionData)) {
          return {
            section: section,
            key: key + ':footer',
            index: null,
            header: false,
            trailingSection: sections[i + 1]
          };
        } else {
          var extractor = section.keyExtractor || keyExtractor || _VirtualizeUtils.keyExtractor;
          return {
            section: section,
            key: key + ':' + extractor(getItem(sectionData, itemIndex), itemIndex),
            index: itemIndex,
            leadingItem: getItem(sectionData, itemIndex - 1),
            leadingSection: sections[i - 1],
            trailingItem: getItem(sectionData, itemIndex + 1),
            trailingSection: sections[i + 1]
          };
        }
      }
    }
  }, {
    key: "_getSeparatorComponent",
    value: function _getSeparatorComponent(index, info, listItemCount) {
      info = info || this._subExtractor(index);
      if (!info) {
        return null;
      }
      var ItemSeparatorComponent = info.section.ItemSeparatorComponent || this.props.ItemSeparatorComponent;
      var SectionSeparatorComponent = this.props.SectionSeparatorComponent;
      var isLastItemInList = index === listItemCount - 1;
      var isLastItemInSection = info.index === this.props.getItemCount(info.section.data) - 1;
      if (SectionSeparatorComponent && isLastItemInSection) {
        return SectionSeparatorComponent;
      }
      if (ItemSeparatorComponent && !isLastItemInSection && !isLastItemInList) {
        return ItemSeparatorComponent;
      }
      return null;
    }
  }]);
  return VirtualizedSectionList;
}(React.PureComponent);
function ItemWithSeparator(props) {
  var LeadingSeparatorComponent = props.LeadingSeparatorComponent,
    SeparatorComponent = props.SeparatorComponent,
    cellKey = props.cellKey,
    prevCellKey = props.prevCellKey,
    setSelfHighlightCallback = props.setSelfHighlightCallback,
    updateHighlightFor = props.updateHighlightFor,
    setSelfUpdatePropsCallback = props.setSelfUpdatePropsCallback,
    updatePropsFor = props.updatePropsFor,
    item = props.item,
    index = props.index,
    section = props.section,
    inverted = props.inverted;
  var _React$useState = React.useState(false),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    leadingSeparatorHiglighted = _React$useState2[0],
    setLeadingSeparatorHighlighted = _React$useState2[1];
  var _React$useState3 = React.useState(false),
    _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
    separatorHighlighted = _React$useState4[0],
    setSeparatorHighlighted = _React$useState4[1];
  var _React$useState5 = React.useState({
      leadingItem: props.leadingItem,
      leadingSection: props.leadingSection,
      section: props.section,
      trailingItem: props.item,
      trailingSection: props.trailingSection
    }),
    _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
    leadingSeparatorProps = _React$useState6[0],
    setLeadingSeparatorProps = _React$useState6[1];
  var _React$useState7 = React.useState({
      leadingItem: props.item,
      leadingSection: props.leadingSection,
      section: props.section,
      trailingItem: props.trailingItem,
      trailingSection: props.trailingSection
    }),
    _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
    separatorProps = _React$useState8[0],
    setSeparatorProps = _React$useState8[1];
  React.useEffect(function () {
    setSelfHighlightCallback(cellKey, setSeparatorHighlighted);
    setSelfUpdatePropsCallback(cellKey, setSeparatorProps);
    return function () {
      setSelfUpdatePropsCallback(cellKey, null);
      setSelfHighlightCallback(cellKey, null);
    };
  }, [cellKey, setSelfHighlightCallback, setSeparatorProps, setSelfUpdatePropsCallback]);
  var separators = {
    highlight: function highlight() {
      setLeadingSeparatorHighlighted(true);
      setSeparatorHighlighted(true);
      if (prevCellKey != null) {
        updateHighlightFor(prevCellKey, true);
      }
    },
    unhighlight: function unhighlight() {
      setLeadingSeparatorHighlighted(false);
      setSeparatorHighlighted(false);
      if (prevCellKey != null) {
        updateHighlightFor(prevCellKey, false);
      }
    },
    updateProps: function updateProps(select, newProps) {
      if (select === 'leading') {
        if (LeadingSeparatorComponent != null) {
          setLeadingSeparatorProps(Object.assign({}, leadingSeparatorProps, newProps));
        } else if (prevCellKey != null) {
          updatePropsFor(prevCellKey, Object.assign({}, leadingSeparatorProps, newProps));
        }
      } else if (select === 'trailing' && SeparatorComponent != null) {
        setSeparatorProps(Object.assign({}, separatorProps, newProps));
      }
    }
  };
  var element = props.renderItem({
    item: item,
    index: index,
    section: section,
    separators: separators
  });
  var leadingSeparator = LeadingSeparatorComponent != null && (0, _jsxRuntime.jsx)(LeadingSeparatorComponent, Object.assign({
    highlighted: leadingSeparatorHiglighted
  }, leadingSeparatorProps));
  var separator = SeparatorComponent != null && (0, _jsxRuntime.jsx)(SeparatorComponent, Object.assign({
    highlighted: separatorHighlighted
  }, separatorProps));
  return leadingSeparator || separator ? (0, _jsxRuntime.jsxs)(_reactNative.View, {
    children: [inverted === false ? leadingSeparator : separator, element, inverted === false ? separator : leadingSeparator]
  }) : element;
}
module.exports = VirtualizedSectionList;