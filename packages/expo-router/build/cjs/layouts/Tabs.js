"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Tabs = void 0;
function _bottomTabs() {
  const data = require("@react-navigation/bottom-tabs");
  _bottomTabs = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _Pressable() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Pressable"));
  _Pressable = function () {
    return data;
  };
  return data;
}
function _Platform() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Platform"));
  _Platform = function () {
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
function _Link() {
  const data = require("../link/Link");
  _Link = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
// This is the only way to access the navigator.
const BottomTabNavigator = (0, _bottomTabs().createBottomTabNavigator)().Navigator;
const Tabs = exports.Tabs = (0, _withLayoutContext().withLayoutContext)(BottomTabNavigator, screens => {
  // Support the `href` shortcut prop.
  return screens.map(screen => {
    if (typeof screen.options !== 'function' && screen.options?.href !== undefined) {
      const {
        href,
        ...options
      } = screen.options;
      if (options.tabBarButton) {
        throw new Error('Cannot use `href` and `tabBarButton` together.');
      }
      return {
        ...screen,
        options: {
          ...options,
          tabBarButton: props => {
            if (href == null) {
              return null;
            }
            const children = _Platform().default.OS === 'web' ? props.children : /*#__PURE__*/_react().default.createElement(_Pressable().default, null, props.children);
            return /*#__PURE__*/_react().default.createElement(_Link().Link, _extends({}, props, {
              style: [{
                display: 'flex'
              }, props.style],
              href: href,
              asChild: _Platform().default.OS !== 'web',
              children: children
            }));
          }
        }
      };
    }
    return screen;
  });
});
var _default = exports.default = Tabs;
//# sourceMappingURL=Tabs.js.map