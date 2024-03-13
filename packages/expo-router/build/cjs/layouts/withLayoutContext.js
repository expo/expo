"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useFilterScreenChildren = useFilterScreenChildren;
exports.withLayoutContext = withLayoutContext;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
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
function _useScreens() {
  const data = require("../useScreens");
  _useScreens = function () {
    return data;
  };
  return data;
}
function _Screen() {
  const data = require("../views/Screen");
  _Screen = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function useFilterScreenChildren(children, {
  isCustomNavigator,
  contextKey
} = {}) {
  return _react().default.useMemo(() => {
    const customChildren = [];
    const screens = _react().default.Children.map(children, child => {
      if ( /*#__PURE__*/_react().default.isValidElement(child) && child && child.type === _Screen().Screen) {
        if (!child.props.name) {
          throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
          if (['children', 'component', 'getComponent'].some(key => key in child.props)) {
            throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
          }
        }
        return child.props;
      } else {
        if (isCustomNavigator) {
          customChildren.push(child);
        } else {
          console.warn(`Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`);
        }
      }
    });

    // Add an assertion for development
    if (process.env.NODE_ENV !== 'production') {
      // Assert if names are not unique
      const names = screens?.map(screen => screen.name);
      if (names && new Set(names).size !== names.length) {
        throw new Error('Screen names must be unique: ' + names);
      }
    }
    return {
      screens,
      children: customChildren
    };
  }, [children]);
}

/** Return a navigator that automatically injects matched routes and renders nothing when there are no children. Return type with children prop optional */
function withLayoutContext(Nav, processor) {
  const Navigator = /*#__PURE__*/_react().default.forwardRef(({
    children: userDefinedChildren,
    ...props
  }, ref) => {
    const contextKey = (0, _Route().useContextKey)();
    const {
      screens
    } = useFilterScreenChildren(userDefinedChildren, {
      contextKey
    });
    const processed = processor ? processor(screens ?? []) : screens;
    const sorted = (0, _useScreens().useSortedScreens)(processed ?? []);

    // Prevent throwing an error when there are no screens.
    if (!sorted.length) {
      return null;
    }
    return (
      /*#__PURE__*/
      // @ts-expect-error
      _react().default.createElement(Nav, _extends({}, props, {
        id: contextKey,
        ref: ref,
        children: sorted
      }))
    );
  });

  // @ts-expect-error
  Navigator.Screen = _Screen().Screen;
  // @ts-expect-error
  return Navigator;
}
//# sourceMappingURL=withLayoutContext.js.map