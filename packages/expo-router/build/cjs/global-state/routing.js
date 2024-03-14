"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canDismiss = canDismiss;
exports.canGoBack = canGoBack;
exports.dismiss = dismiss;
exports.dismissAll = dismissAll;
exports.goBack = goBack;
exports.linkTo = linkTo;
exports.navigate = navigate;
exports.push = push;
exports.replace = replace;
exports.setParams = setParams;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function Linking() {
  const data = _interopRequireWildcard(require("expo-linking"));
  Linking = function () {
    return data;
  };
  return data;
}
function _nonSecure() {
  const data = require("nanoid/non-secure");
  _nonSecure = function () {
    return data;
  };
  return data;
}
function _href() {
  const data = require("../link/href");
  _href = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = require("../link/path");
  _path = function () {
    return data;
  };
  return data;
}
function _url() {
  const data = require("../utils/url");
  _url = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function assertIsReady(store) {
  if (!store.navigationRef.isReady()) {
    throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
  }
}
function navigate(url) {
  return this.linkTo((0, _href().resolveHref)(url), 'NAVIGATE');
}
function push(url) {
  return this.linkTo((0, _href().resolveHref)(url), 'PUSH');
}
function dismiss(count) {
  this.navigationRef?.dispatch(_native().StackActions.pop(count));
}
function replace(url) {
  return this.linkTo((0, _href().resolveHref)(url), 'REPLACE');
}
function dismissAll() {
  this.navigationRef?.dispatch(_native().StackActions.popToTop());
}
function goBack() {
  assertIsReady(this);
  this.navigationRef?.current?.goBack();
}
function canGoBack() {
  // Return a default value here if the navigation hasn't mounted yet.
  // This can happen if the user calls `canGoBack` from the Root Layout route
  // before mounting a navigator. This behavior exists due to React Navigation being dynamically
  // constructed at runtime. We can get rid of this in the future if we use
  // the static configuration internally.
  if (!this.navigationRef.isReady()) {
    return false;
  }
  return this.navigationRef?.current?.canGoBack() ?? false;
}
function canDismiss() {
  let state = this.rootState;

  // Keep traversing down the state tree until we find a stack navigator that we can pop
  while (state) {
    if (state.type === 'stack' && state.routes.length > 1) {
      return true;
    }
    if (state.index === undefined) return false;
    state = state.routes?.[state.index]?.state;
  }
  return false;
}
function setParams(params = {}) {
  assertIsReady(this);
  return (this.navigationRef?.current?.setParams)(params);
}
function linkTo(href, event) {
  if ((0, _url().shouldLinkExternally)(href)) {
    Linking().openURL(href);
    return;
  }
  assertIsReady(this);
  const navigationRef = this.navigationRef.current;
  if (navigationRef == null) {
    throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
  }
  if (!this.linking) {
    throw new Error('Attempted to link to route when no routes are present');
  }
  if (href === '..' || href === '../') {
    navigationRef.goBack();
    return;
  }
  const rootState = navigationRef.getRootState();
  if (href.startsWith('.')) {
    // Resolve base path by merging the current segments with the params
    let base = this.routeInfo?.segments?.map(segment => {
      if (!segment.startsWith('[')) return segment;
      if (segment.startsWith('[...')) {
        segment = segment.slice(4, -1);
        const params = this.routeInfo?.params?.[segment];
        if (Array.isArray(params)) {
          return params.join('/');
        } else {
          return params?.split(',')?.join('/') ?? '';
        }
      } else {
        segment = segment.slice(1, -1);
        return this.routeInfo?.params?.[segment];
      }
    }).filter(Boolean).join('/') ?? '/';
    if (!this.routeInfo?.isIndex) {
      base += '/..';
    }
    href = (0, _path().resolve)(base, href);
  }
  const state = this.linking.getStateFromPath(href, this.linking.config);
  if (!state || state.routes.length === 0) {
    console.error('Could not generate a valid navigation state for the given path: ' + href);
    return;
  }
  return navigationRef.dispatch(getNavigateAction(state, rootState, event));
}
function rewriteNavigationStateToParams(state, params = {}) {
  if (!state) return params;
  // We Should always have at least one route in the state
  const lastRoute = state.routes[state.routes.length - 1];
  params.screen = lastRoute.name;
  // Weirdly, this always needs to be an object. If it's undefined, it won't work.
  params.params = lastRoute.params ? JSON.parse(JSON.stringify(lastRoute.params)) : {};
  if (lastRoute.state) {
    rewriteNavigationStateToParams(lastRoute.state, params.params);
  }
  return JSON.parse(JSON.stringify(params));
}
function getNavigateAction(state, parentState, type = 'NAVIGATE') {
  const {
    screen,
    params
  } = rewriteNavigationStateToParams(state);
  let key;
  if (type === 'PUSH') {
    /*
     * The StackAction.PUSH does not work correctly with Expo Router.
     *
     * Expo Router provides a getId() function for every route, altering how React Navigation handles stack routing.
     * Ordinarily, PUSH always adds a new screen to the stack. However, with getId() present, it navigates to the screen with the matching ID instead (by moving the screen to the top of the stack)
     * When you try and push to a screen with the same ID, no navigation will occur
     * Refer to: https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L279-L290
     *
     * Expo Router needs to retain the default behavior of PUSH, consistently adding new screens to the stack, even if their IDs are identical.
     *
     * To resolve this issue, we switch to using a NAVIGATE action with a new key. In the navigate action, screens are matched by either key or getId() function.
     * By generating a unique new key, we ensure that the screen is always pushed onto the stack.
     *
     */
    type = 'NAVIGATE';
    if (parentState.type === 'stack') {
      key = `${screen}-${(0, _nonSecure().nanoid)()}`; // @see https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L406-L407
    }
  } else if (type === 'REPLACE' && parentState.type === 'tab') {
    type = 'JUMP_TO';
  }
  return {
    type,
    target: parentState.key,
    payload: {
      key,
      name: screen,
      params
    }
  };
}
//# sourceMappingURL=routing.js.map