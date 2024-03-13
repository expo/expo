"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useLinkToPathProps;
function _Platform() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Platform"));
  _Platform = function () {
    return data;
  };
  return data;
}
function _getPathFromState() {
  const data = require("../fork/getPathFromState");
  _getPathFromState = function () {
    return data;
  };
  return data;
}
function _routerStore() {
  const data = require("../global-state/router-store");
  _routerStore = function () {
    return data;
  };
  return data;
}
function _matchers() {
  const data = require("../matchers");
  _matchers = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function eventShouldPreventDefault(e) {
  if (e?.defaultPrevented) {
    return false;
  }
  if (
  // Only check MouseEvents
  'button' in e &&
  // ignore clicks with modifier keys
  !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey && (e.button == null || e.button === 0) &&
  // Only accept left clicks
  [undefined, null, '', 'self'].includes(e.currentTarget.target) // let browser handle "target=_blank" etc.
  ) {
    return true;
  }
  return false;
}
function useLinkToPathProps(props) {
  const {
    linkTo
  } = (0, _routerStore().useExpoRouter)();
  const onPress = e => {
    let shouldHandle = false;
    if (_Platform().default.OS !== 'web' || !e) {
      shouldHandle = e ? !e.defaultPrevented : true;
    } else if (eventShouldPreventDefault(e)) {
      e.preventDefault();
      shouldHandle = true;
    }
    if (shouldHandle) {
      linkTo(props.href, props.event);
    }
  };
  return {
    // Ensure there's always a value for href. Manually append the baseUrl to the href prop that shows in the static HTML.
    href: (0, _getPathFromState().appendBaseUrl)((0, _matchers().stripGroupSegmentsFromPath)(props.href) || '/'),
    role: 'link',
    onPress
  };
}
//# sourceMappingURL=useLinkToPathProps.js.map