"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Html = Html;
exports.ScrollViewStyleReset = ScrollViewStyleReset;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
function ScrollViewStyleReset() {
  return /*#__PURE__*/_react().default.createElement("style", {
    id: "expo-reset",
    dangerouslySetInnerHTML: {
      __html: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`
    }
  });
}
function Html({
  children
}) {
  return /*#__PURE__*/_react().default.createElement("html", {
    lang: "en"
  }, /*#__PURE__*/_react().default.createElement("head", null, /*#__PURE__*/_react().default.createElement("meta", {
    charSet: "utf-8"
  }), /*#__PURE__*/_react().default.createElement("meta", {
    httpEquiv: "X-UA-Compatible",
    content: "IE=edge"
  }), /*#__PURE__*/_react().default.createElement("meta", {
    name: "viewport",
    content: "width=device-width, initial-scale=1, shrink-to-fit=no"
  }), /*#__PURE__*/_react().default.createElement(ScrollViewStyleReset, null)), /*#__PURE__*/_react().default.createElement("body", null, children));
}
//# sourceMappingURL=html.js.map