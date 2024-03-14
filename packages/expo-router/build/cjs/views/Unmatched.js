"use strict";
// Copyright © 2024 650 Industries.
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Unmatched = Unmatched;
function _expoLinking() {
  const data = require("expo-linking");
  _expoLinking = function () {
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
function _StyleSheet() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/StyleSheet"));
  _StyleSheet = function () {
    return data;
  };
  return data;
}
function _Text() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Text"));
  _Text = function () {
    return data;
  };
  return data;
}
function _View() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/View"));
  _View = function () {
    return data;
  };
  return data;
}
function _hooks() {
  const data = require("../hooks");
  _hooks = function () {
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
function _useNavigation() {
  const data = require("../useNavigation");
  _useNavigation = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const useLayoutEffect = typeof window !== 'undefined' ? _react().default.useLayoutEffect : function () {};
function NoSSR({
  children
}) {
  const [render, setRender] = _react().default.useState(false);
  _react().default.useEffect(() => {
    setRender(true);
  }, []);
  if (!render) {
    return null;
  }
  return /*#__PURE__*/_react().default.createElement(_react().default.Fragment, null, children);
}

/** Default screen for unmatched routes. */
function Unmatched() {
  const router = (0, _hooks().useRouter)();
  const navigation = (0, _useNavigation().useNavigation)();
  const pathname = (0, _hooks().usePathname)();
  const url = (0, _expoLinking().createURL)(pathname);
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Not Found'
    });
  }, [navigation]);
  return /*#__PURE__*/_react().default.createElement(_View().default, {
    style: styles.container
  }, /*#__PURE__*/_react().default.createElement(_Text().default, {
    role: "heading",
    "aria-level": 1,
    style: styles.title
  }, "Unmatched Route"), /*#__PURE__*/_react().default.createElement(_Text().default, {
    role: "heading",
    "aria-level": 2,
    style: styles.subtitle
  }, "Page could not be found.", ' ', /*#__PURE__*/_react().default.createElement(_Text().default, {
    onPress: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    },
    style: styles.link
  }, "Go back.")), /*#__PURE__*/_react().default.createElement(NoSSR, null, /*#__PURE__*/_react().default.createElement(_Link().Link, {
    href: pathname,
    replace: true,
    style: styles.link
  }, url)), /*#__PURE__*/_react().default.createElement(_Link().Link, {
    href: "/_sitemap",
    replace: true,
    style: [styles.link, {
      marginTop: 8
    }]
  }, "Sitemap"));
}
const styles = _StyleSheet().default.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: 'white',
    fontSize: 36,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomColor: '#323232',
    borderBottomWidth: 1,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  subtitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center'
  },
  link: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center'
  }
});
//# sourceMappingURL=Unmatched.js.map