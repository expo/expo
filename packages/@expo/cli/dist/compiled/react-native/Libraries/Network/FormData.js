'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var FormData = function () {
  function FormData() {
    (0, _classCallCheck2.default)(this, FormData);
    this._parts = [];
  }
  (0, _createClass2.default)(FormData, [{
    key: "append",
    value: function append(key, value) {
      this._parts.push([key, value]);
    }
  }, {
    key: "getAll",
    value: function getAll(key) {
      return this._parts.filter(function (_ref) {
        var _ref2 = (0, _slicedToArray2.default)(_ref, 1),
          name = _ref2[0];
        return name === key;
      }).map(function (_ref3) {
        var _ref4 = (0, _slicedToArray2.default)(_ref3, 2),
          value = _ref4[1];
        return value;
      });
    }
  }, {
    key: "getParts",
    value: function getParts() {
      return this._parts.map(function (_ref5) {
        var _ref6 = (0, _slicedToArray2.default)(_ref5, 2),
          name = _ref6[0],
          value = _ref6[1];
        var contentDisposition = 'form-data; name="' + name + '"';
        var headers = {
          'content-disposition': contentDisposition
        };
        if (typeof value === 'object' && !Array.isArray(value) && value) {
          if (typeof value.name === 'string') {
            headers['content-disposition'] += '; filename="' + value.name + '"';
          }
          if (typeof value.type === 'string') {
            headers['content-type'] = value.type;
          }
          return Object.assign({}, value, {
            headers: headers,
            fieldName: name
          });
        }
        return {
          string: String(value),
          headers: headers,
          fieldName: name
        };
      });
    }
  }]);
  return FormData;
}();
module.exports = FormData;