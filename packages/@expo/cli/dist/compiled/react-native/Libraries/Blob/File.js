'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Blob = require('./Blob');
var invariant = require('invariant');
var File = function (_Blob) {
  (0, _inherits2.default)(File, _Blob);
  var _super = _createSuper(File);
  function File(parts, name, options) {
    var _this;
    (0, _classCallCheck2.default)(this, File);
    invariant(parts != null && name != null, 'Failed to construct `File`: Must pass both `parts` and `name` arguments.');
    _this = _super.call(this, parts, options);
    _this.data.name = name;
    return _this;
  }
  (0, _createClass2.default)(File, [{
    key: "name",
    get: function get() {
      invariant(this.data.name != null, 'Files must have a name set.');
      return this.data.name;
    }
  }, {
    key: "lastModified",
    get: function get() {
      return this.data.lastModified || 0;
    }
  }]);
  return File;
}(Blob);
module.exports = File;