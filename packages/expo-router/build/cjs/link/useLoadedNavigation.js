"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useLoadedNavigation = useLoadedNavigation;
exports.useOptionalNavigation = useOptionalNavigation;
function _native() {
  const data = require("@react-navigation/native");
  _native = function () {
    return data;
  };
  return data;
}
function _react() {
  const data = require("react");
  _react = function () {
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
/** Returns a callback which is invoked when the navigation state has loaded. */
function useLoadedNavigation() {
  const {
    navigationRef
  } = (0, _routerStore().useExpoRouter)();
  const navigation = (0, _native().useNavigation)();
  const isMounted = (0, _react().useRef)(true);
  const pending = (0, _react().useRef)([]);
  (0, _react().useEffect)(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const flush = (0, _react().useCallback)(() => {
    if (isMounted.current) {
      const pendingCallbacks = pending.current;
      pending.current = [];
      pendingCallbacks.forEach(callback => {
        callback(navigation);
      });
    }
  }, [navigation]);
  (0, _react().useEffect)(() => {
    if (navigationRef.current) {
      flush();
    }
  }, [flush]);
  const push = (0, _react().useCallback)(fn => {
    pending.current.push(fn);
    if (navigationRef.current) {
      flush();
    }
  }, [flush]);
  return push;
}
function useOptionalNavigation() {
  const [navigation, setNavigation] = (0, _react().useState)(null);
  const loadNavigation = useLoadedNavigation();
  (0, _react().useEffect)(() => {
    loadNavigation(nav => setNavigation(nav));
  }, []);
  return navigation;
}
//# sourceMappingURL=useLoadedNavigation.js.map