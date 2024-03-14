"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Drawer = void 0;
function _drawer() {
  const data = require("@react-navigation/drawer");
  _drawer = function () {
    return data;
  };
  return data;
}
function _withLayoutContext() {
  const data = require("./withLayoutContext");
  _withLayoutContext = function () {
    return data;
  };
  return data;
}
const DrawerNavigator = (0, _drawer().createDrawerNavigator)().Navigator;
const Drawer = exports.Drawer = (0, _withLayoutContext().withLayoutContext)(DrawerNavigator);
var _default = exports.default = Drawer;
//# sourceMappingURL=Drawer.js.map