'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _virtualizedLists = require("@react-native/virtualized-lists");
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["stickySectionHeadersEnabled"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var SectionList = function (_React$PureComponent) {
  (0, _inherits2.default)(SectionList, _React$PureComponent);
  var _super = _createSuper(SectionList);
  function SectionList() {
    var _this;
    (0, _classCallCheck2.default)(this, SectionList);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._captureRef = function (ref) {
      _this._wrapperListRef = ref;
    };
    return _this;
  }
  (0, _createClass2.default)(SectionList, [{
    key: "scrollToLocation",
    value: function scrollToLocation(params) {
      if (this._wrapperListRef != null) {
        this._wrapperListRef.scrollToLocation(params);
      }
    }
  }, {
    key: "recordInteraction",
    value: function recordInteraction() {
      var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
      listRef && listRef.recordInteraction();
    }
  }, {
    key: "flashScrollIndicators",
    value: function flashScrollIndicators() {
      var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
      listRef && listRef.flashScrollIndicators();
    }
  }, {
    key: "getScrollResponder",
    value: function getScrollResponder() {
      var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
      if (listRef) {
        return listRef.getScrollResponder();
      }
    }
  }, {
    key: "getScrollableNode",
    value: function getScrollableNode() {
      var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
      if (listRef) {
        return listRef.getScrollableNode();
      }
    }
  }, {
    key: "setNativeProps",
    value: function setNativeProps(props) {
      var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
      if (listRef) {
        listRef.setNativeProps(props);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props = this.props,
        _stickySectionHeadersEnabled = _this$props.stickySectionHeadersEnabled,
        restProps = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      var stickySectionHeadersEnabled = _stickySectionHeadersEnabled != null ? _stickySectionHeadersEnabled : _Platform.default.OS === 'ios';
      return (0, _jsxRuntime.jsx)(_virtualizedLists.VirtualizedSectionList, Object.assign({}, restProps, {
        stickySectionHeadersEnabled: stickySectionHeadersEnabled,
        ref: this._captureRef,
        getItemCount: function getItemCount(items) {
          return items.length;
        },
        getItem: function getItem(items, index) {
          return items[index];
        }
      }));
    }
  }]);
  return SectionList;
}(React.PureComponent);
exports.default = SectionList;