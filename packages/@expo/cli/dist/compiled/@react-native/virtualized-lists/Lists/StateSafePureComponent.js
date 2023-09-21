var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var StateSafePureComponent = function (_React$PureComponent) {
  (0, _inherits2.default)(StateSafePureComponent, _React$PureComponent);
  var _super = _createSuper(StateSafePureComponent);
  function StateSafePureComponent(props) {
    var _this;
    (0, _classCallCheck2.default)(this, StateSafePureComponent);
    _this = _super.call(this, props);
    _this._inAsyncStateUpdate = false;
    _this._installSetStateHooks();
    return _this;
  }
  (0, _createClass2.default)(StateSafePureComponent, [{
    key: "setState",
    value: function setState(partialState, callback) {
      var _this2 = this;
      if (typeof partialState === 'function') {
        (0, _get2.default)((0, _getPrototypeOf2.default)(StateSafePureComponent.prototype), "setState", this).call(this, function (state, props) {
          _this2._inAsyncStateUpdate = true;
          var ret;
          try {
            ret = partialState(state, props);
          } catch (err) {
            throw err;
          } finally {
            _this2._inAsyncStateUpdate = false;
          }
          return ret;
        }, callback);
      } else {
        (0, _get2.default)((0, _getPrototypeOf2.default)(StateSafePureComponent.prototype), "setState", this).call(this, partialState, callback);
      }
    }
  }, {
    key: "_installSetStateHooks",
    value: function _installSetStateHooks() {
      var that = this;
      var props = this.props,
        state = this.state;
      Object.defineProperty(this, 'props', {
        get: function get() {
          (0, _invariant.default)(!that._inAsyncStateUpdate, '"this.props" should not be accessed during state updates');
          return props;
        },
        set: function set(newProps) {
          props = newProps;
        }
      });
      Object.defineProperty(this, 'state', {
        get: function get() {
          (0, _invariant.default)(!that._inAsyncStateUpdate, '"this.state" should not be acceessed during state updates');
          return state;
        },
        set: function set(newState) {
          state = newState;
        }
      });
    }
  }]);
  return StateSafePureComponent;
}(React.PureComponent);
exports.default = StateSafePureComponent;