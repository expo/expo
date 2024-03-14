"use strict";
// Copyright © 2024 650 Industries.
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefaultNavigator = DefaultNavigator;
exports.Navigator = Navigator;
exports.NavigatorContext = void 0;
exports.QualifiedSlot = QualifiedSlot;
exports.Slot = Slot;
exports.useNavigatorContext = useNavigatorContext;
exports.useSlot = useSlot;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function React() {
  const data = _interopRequireWildcard(require("react"));
  React = function () {
    return data;
  };
  return data;
}
function _reactNativeSafeAreaContext() {
  const data = require("react-native-safe-area-context");
  _reactNativeSafeAreaContext = function () {
    return data;
  };
  return data;
}
function _Screen() {
  const data = require("./Screen");
  _Screen = function () {
    return data;
  };
  return data;
}
function _Route() {
  const data = require("../Route");
  _Route = function () {
    return data;
  };
  return data;
}
function _withLayoutContext() {
  const data = require("../layouts/withLayoutContext");
  _withLayoutContext = function () {
    return data;
  };
  return data;
}
function _useScreens() {
  const data = require("../useScreens");
  _useScreens = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// TODO: This might already exist upstream, maybe something like `useCurrentRender` ?
const NavigatorContext = exports.NavigatorContext = /*#__PURE__*/React().createContext(null);
if (process.env.NODE_ENV !== 'production') {
  NavigatorContext.displayName = 'NavigatorContext';
}
/** An unstyled custom navigator. Good for basic web layouts */
function Navigator({
  initialRouteName,
  screenOptions,
  children,
  router
}) {
  const contextKey = (0, _Route().useContextKey)();

  // Allows adding Screen components as children to configure routes.
  const {
    screens,
    children: otherSlot
  } = (0, _withLayoutContext().useFilterScreenChildren)(children, {
    isCustomNavigator: true,
    contextKey
  });
  const sorted = (0, _useScreens().useSortedScreens)(screens ?? []);
  if (!sorted.length) {
    console.warn(`Navigator at "${contextKey}" has no children.`);
    return null;
  }
  return /*#__PURE__*/React().createElement(QualifiedNavigator, {
    initialRouteName: initialRouteName,
    screenOptions: screenOptions,
    screens: sorted,
    contextKey: contextKey,
    router: router
  }, otherSlot);
}
function QualifiedNavigator({
  initialRouteName,
  screenOptions,
  children,
  screens,
  contextKey,
  router = _native().StackRouter
}) {
  const {
    state,
    navigation,
    descriptors,
    NavigationContent
  } = (0, _native().useNavigationBuilder)(router, {
    // Used for getting the parent with navigation.getParent('/normalized/path')
    id: contextKey,
    children: screens,
    screenOptions,
    initialRouteName
  });
  return /*#__PURE__*/React().createElement(NavigatorContext.Provider, {
    value: {
      contextKey,
      state,
      navigation,
      descriptors,
      router
    }
  }, /*#__PURE__*/React().createElement(NavigationContent, null, children));
}
function useNavigatorContext() {
  const context = React().useContext(NavigatorContext);
  if (!context) {
    throw new Error('useNavigatorContext must be used within a <Navigator />');
  }
  return context;
}
function useSlot() {
  const context = useNavigatorContext();
  const {
    state,
    descriptors
  } = context;
  const current = state.routes.find((route, i) => {
    return state.index === i;
  });
  if (!current) {
    return null;
  }
  return descriptors[current.key]?.render() ?? null;
}

/** Renders the currently selected content. */
function Slot(props) {
  const contextKey = (0, _Route().useContextKey)();
  const context = React().useContext(NavigatorContext);
  // Ensure the context is for the current contextKey
  if (context?.contextKey !== contextKey) {
    // Qualify the content and re-export.
    return /*#__PURE__*/React().createElement(Navigator, props, /*#__PURE__*/React().createElement(QualifiedSlot, null));
  }
  return /*#__PURE__*/React().createElement(QualifiedSlot, null);
}
function QualifiedSlot() {
  return useSlot();
}
function DefaultNavigator() {
  return /*#__PURE__*/React().createElement(_reactNativeSafeAreaContext().SafeAreaView, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React().createElement(Navigator, null, /*#__PURE__*/React().createElement(QualifiedSlot, null)));
}
Navigator.Slot = Slot;
Navigator.useContext = useNavigatorContext;

/** Used to configure route settings. */
Navigator.Screen = _Screen().Screen;
//# sourceMappingURL=Navigator.js.map