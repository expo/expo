"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Head = void 0;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _reactHelmetAsync() {
  const data = require("react-helmet-async");
  _reactHelmetAsync = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const Head = ({
  children
}) => {
  return /*#__PURE__*/_react().default.createElement(_reactHelmetAsync().Helmet, null, children);
};
exports.Head = Head;
Head.Provider = _reactHelmetAsync().HelmetProvider;
//# sourceMappingURL=ExpoHead.js.map