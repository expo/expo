"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGetIdForRoute = createGetIdForRoute;
exports.getQualifiedRouteComponent = getQualifiedRouteComponent;
exports.useSortedScreens = useSortedScreens;
function _react() {
  const data = _interopRequireDefault(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _Route() {
  const data = require("./Route");
  _Route = function () {
    return data;
  };
  return data;
}
function _importMode() {
  const data = _interopRequireDefault(require("./import-mode"));
  _importMode = function () {
    return data;
  };
  return data;
}
function _primitives() {
  const data = require("./primitives");
  _primitives = function () {
    return data;
  };
  return data;
}
function _EmptyRoute() {
  const data = require("./views/EmptyRoute");
  _EmptyRoute = function () {
    return data;
  };
  return data;
}
function _SuspenseFallback() {
  const data = require("./views/SuspenseFallback");
  _SuspenseFallback = function () {
    return data;
  };
  return data;
}
function _Try() {
  const data = require("./views/Try");
  _Try = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function getSortedChildren(children, order, initialRouteName) {
  if (!order?.length) {
    return children.sort((0, _Route().sortRoutesWithInitial)(initialRouteName)).map(route => ({
      route,
      props: {}
    }));
  }
  const entries = [...children];
  const ordered = order.map(({
    name,
    redirect,
    initialParams,
    listeners,
    options,
    getId
  }) => {
    if (!entries.length) {
      console.warn(`[Layout children]: Too many screens defined. Route "${name}" is extraneous.`);
      return null;
    }
    const matchIndex = entries.findIndex(child => child.route === name);
    if (matchIndex === -1) {
      console.warn(`[Layout children]: No route named "${name}" exists in nested children:`, children.map(({
        route
      }) => route));
      return null;
    } else {
      // Get match and remove from entries
      const match = entries[matchIndex];
      entries.splice(matchIndex, 1);

      // Ensure to return null after removing from entries.
      if (redirect) {
        if (typeof redirect === 'string') {
          throw new Error(`Redirecting to a specific route is not supported yet.`);
        }
        return null;
      }
      return {
        route: match,
        props: {
          initialParams,
          listeners,
          options,
          getId
        }
      };
    }
  }).filter(Boolean);

  // Add any remaining children
  ordered.push(...entries.sort((0, _Route().sortRoutesWithInitial)(initialRouteName)).map(route => ({
    route,
    props: {}
  })));
  return ordered;
}

/**
 * @returns React Navigation screens sorted by the `route` property.
 */
function useSortedScreens(order) {
  const node = (0, _Route().useRouteNode)();
  const sorted = node?.children?.length ? getSortedChildren(node.children, order, node.initialRouteName) : [];
  return _react().default.useMemo(() => sorted.map(value => routeToScreen(value.route, value.props)), [sorted]);
}
function fromImport({
  ErrorBoundary,
  ...component
}) {
  if (ErrorBoundary) {
    return {
      default: /*#__PURE__*/_react().default.forwardRef((props, ref) => {
        const children = /*#__PURE__*/_react().default.createElement(component.default || _EmptyRoute().EmptyRoute, {
          ...props,
          ref
        });
        return /*#__PURE__*/_react().default.createElement(_Try().Try, {
          catch: ErrorBoundary
        }, children);
      })
    };
  }
  if (process.env.NODE_ENV !== 'production') {
    if (typeof component.default === 'object' && component.default && Object.keys(component.default).length === 0) {
      return {
        default: _EmptyRoute().EmptyRoute
      };
    }
  }
  return {
    default: component.default
  };
}
function fromLoadedRoute(res) {
  if (!(res instanceof Promise)) {
    return fromImport(res);
  }
  return res.then(fromImport);
}

// TODO: Maybe there's a more React-y way to do this?
// Without this store, the process enters a recursive loop.
const qualifiedStore = new WeakMap();

/** Wrap the component with various enhancements and add access to child routes. */
function getQualifiedRouteComponent(value) {
  if (qualifiedStore.has(value)) {
    return qualifiedStore.get(value);
  }
  let ScreenComponent;

  // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
  if (_importMode().default === 'lazy') {
    ScreenComponent = /*#__PURE__*/_react().default.lazy(async () => {
      const res = value.loadRoute();
      return fromLoadedRoute(res);
    });
  } else {
    const res = value.loadRoute();
    const Component = fromImport(res).default;
    ScreenComponent = /*#__PURE__*/_react().default.forwardRef((props, ref) => {
      return /*#__PURE__*/_react().default.createElement(Component, _extends({}, props, {
        ref: ref
      }));
    });
  }
  const getLoadable = (props, ref) => /*#__PURE__*/_react().default.createElement(_react().default.Suspense, {
    fallback: /*#__PURE__*/_react().default.createElement(_SuspenseFallback().SuspenseFallback, {
      route: value
    })
  }, /*#__PURE__*/_react().default.createElement(ScreenComponent, _extends({}, props, {
    ref,
    // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
    // the intention is to make it possible to deduce shared routes.
    segment: value.route
  })));
  const QualifiedRoute = /*#__PURE__*/_react().default.forwardRef(({
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route,
    navigation,
    // Pass all other props to the component
    ...props
  }, ref) => {
    const loadable = getLoadable(props, ref);
    return /*#__PURE__*/_react().default.createElement(_Route().Route, {
      node: value
    }, loadable);
  });
  QualifiedRoute.displayName = `Route(${value.route})`;
  qualifiedStore.set(value, QualifiedRoute);
  return QualifiedRoute;
}

/** @returns a function which provides a screen id that matches the dynamic route name in params. */
function createGetIdForRoute(route) {
  const include = new Map();
  if (route.dynamic) {
    for (const segment of route.dynamic) {
      include.set(segment.name, segment);
    }
  }
  return ({
    params = {}
  } = {}) => {
    const segments = [];
    for (const dynamic of include.values()) {
      const value = params?.[dynamic.name];
      if (Array.isArray(value) && value.length > 0) {
        // If we are an array with a value
        segments.push(value.join('/'));
      } else if (value && !Array.isArray(value)) {
        // If we have a value and not an empty array
        segments.push(value);
      } else if (dynamic.deep) {
        segments.push(`[...${dynamic.name}]`);
      } else {
        segments.push(`[${dynamic.name}]`);
      }
    }
    return segments.join('/') ?? route.contextKey;
  };
}
function routeToScreen(route, {
  options,
  ...props
} = {}) {
  return /*#__PURE__*/_react().default.createElement(_primitives().Screen
  // Users can override the screen getId function.
  , _extends({
    getId: createGetIdForRoute(route)
  }, props, {
    name: route.route,
    key: route.route,
    options: args => {
      // Only eager load generated components
      const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
      const staticResult = typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
      const dynamicResult = typeof options === 'function' ? options?.(args) : options;
      const output = {
        ...staticResult,
        ...dynamicResult
      };

      // Prevent generated screens from showing up in the tab bar.
      if (route.generated) {
        output.tabBarButton = () => null;
        // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
        output.drawerItemStyle = {
          height: 0,
          display: 'none'
        };
      }
      return output;
    },
    getComponent: () => getQualifiedRouteComponent(route)
  }));
}
//# sourceMappingURL=useScreens.js.map