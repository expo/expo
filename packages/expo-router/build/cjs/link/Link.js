"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Link = void 0;
exports.Redirect = Redirect;
function _reactSlot() {
  const data = require("@radix-ui/react-slot");
  _reactSlot = function () {
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
function _Text() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Text"));
  _Text = function () {
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
function _href() {
  const data = require("./href");
  _href = function () {
    return data;
  };
  return data;
}
function _useLinkToPathProps() {
  const data = _interopRequireDefault(require("./useLinkToPathProps"));
  _useLinkToPathProps = function () {
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
function _useFocusEffect() {
  const data = require("../useFocusEffect");
  _useFocusEffect = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); } // Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
/** Redirects to the href as soon as the component is mounted. */
function Redirect({
  href
}) {
  const router = (0, _hooks().useRouter)();
  (0, _useFocusEffect().useFocusEffect)(() => {
    try {
      router.replace(href);
    } catch (error) {
      console.error(error);
    }
  });
  return null;
}
/**
 * Component to render link to another route using a path.
 * Uses an anchor tag on the web.
 *
 * @param props.href Absolute path to route (e.g. `/feeds/hot`).
 * @param props.replace Should replace the current route without adding to the history.
 * @param props.push Should push the current route, always adding to the history.
 * @param props.asChild Forward props to child component. Useful for custom buttons.
 * @param props.children Child elements to render the content.
 * @param props.className On web, this sets the HTML `class` directly. On native, this can be used with CSS interop tools like Nativewind.
 */
const Link = exports.Link = /*#__PURE__*/React().forwardRef(ExpoRouterLink);
Link.resolveHref = _href().resolveHref;

// Mutate the style prop to add the className on web.
function useInteropClassName(props) {
  if (_Platform().default.OS !== 'web') {
    return props.style;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return React().useMemo(() => {
    if (props.className == null) {
      return props.style;
    }
    const cssStyle = {
      $$css: true,
      __routerLinkClassName: props.className
    };
    if (Array.isArray(props.style)) {
      return [...props.style, cssStyle];
    }
    return [props.style, cssStyle];
  }, [props.style, props.className]);
}
const useHrefAttrs = _Platform().default.select({
  web: function useHrefAttrs({
    asChild,
    rel,
    target,
    download
  }) {
    return React().useMemo(() => {
      const hrefAttrs = {
        rel,
        target,
        download
      };
      if (asChild) {
        return hrefAttrs;
      }
      return {
        hrefAttrs
      };
    }, [asChild, rel, target, download]);
  },
  default: function useHrefAttrs() {
    return {};
  }
});
function ExpoRouterLink({
  href,
  replace,
  push,
  // TODO: This does not prevent default on the anchor tag.
  asChild,
  rel,
  target,
  download,
  ...rest
}, ref) {
  // Mutate the style prop to add the className on web.
  const style = useInteropClassName(rest);

  // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
  const hrefAttrs = useHrefAttrs({
    asChild,
    rel,
    target,
    download
  });
  const resolvedHref = React().useMemo(() => {
    if (href == null) {
      throw new Error('Link: href is required');
    }
    return (0, _href().resolveHref)(href);
  }, [href]);
  let event;
  if (push) event = 'PUSH';
  if (replace) event = 'REPLACE';
  const props = (0, _useLinkToPathProps().default)({
    href: resolvedHref,
    event
  });
  const onPress = e => {
    if ('onPress' in rest) {
      rest.onPress?.(e);
    }
    props.onPress(e);
  };
  const Element = asChild ? _reactSlot().Slot : _Text().default;

  // Avoid using createElement directly, favoring JSX, to allow tools like Nativewind to perform custom JSX handling on native.
  return /*#__PURE__*/React().createElement(Element, _extends({
    ref: ref
  }, props, hrefAttrs, rest, {
    style: style
  }, _Platform().default.select({
    web: {
      onClick: onPress
    },
    default: {
      onPress
    }
  })));
}
//# sourceMappingURL=Link.js.map