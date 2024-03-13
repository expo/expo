"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useFocusEffect = useFocusEffect;
function React() {
  const data = _interopRequireWildcard(require("react"));
  React = function () {
    return data;
  };
  return data;
}
function _useLoadedNavigation() {
  const data = require("./link/useLoadedNavigation");
  _useLoadedNavigation = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// A fork of `useFocusEffect` that waits for the navigation state to load before
// running the effect. This is especially useful for native redirects.

/**
 * Hook to run an effect in a focused screen, similar to `React.useEffect`.
 * This can be used to perform side-effects such as fetching data or subscribing to events.
 * The passed callback should be wrapped in `React.useCallback` to avoid running the effect too often.
 *
 * @param callback Memoized callback containing the effect, should optionally return a cleanup function.
 */
function useFocusEffect(effect, do_not_pass_a_second_prop) {
  const navigation = (0, _useLoadedNavigation().useOptionalNavigation)();
  if (do_not_pass_a_second_prop !== undefined) {
    const message = "You passed a second argument to 'useFocusEffect', but it only accepts one argument. " + "If you want to pass a dependency array, you can use 'React.useCallback':\n\n" + 'useFocusEffect(\n' + '  React.useCallback(() => {\n' + '    // Your code here\n' + '  }, [depA, depB])\n' + ');\n\n' + 'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
    console.error(message);
  }
  React().useEffect(() => {
    if (!navigation) {
      return;
    }
    let isFocused = false;
    let cleanup;
    const callback = () => {
      const destroy = effect();
      if (destroy === undefined || typeof destroy === 'function') {
        return destroy;
      }
      if (process.env.NODE_ENV !== 'production') {
        let message = 'An effect function must not return anything besides a function, which is used for clean-up.';
        if (destroy === null) {
          message += " You returned 'null'. If your effect does not require clean-up, return 'undefined' (or nothing).";
        } else if (typeof destroy.then === 'function') {
          message += "\n\nIt looks like you wrote 'useFocusEffect(async () => ...)' or returned a Promise. " + 'Instead, write the async function inside your effect ' + 'and call it immediately:\n\n' + 'useFocusEffect(\n' + '  React.useCallback(() => {\n' + '    async function fetchData() {\n' + '      // You can await here\n' + '      const response = await MyAPI.getData(someId);\n' + '      // ...\n' + '    }\n\n' + '    fetchData();\n' + '  }, [someId])\n' + ');\n\n' + 'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
        } else {
          message += ` You returned '${JSON.stringify(destroy)}'.`;
        }
        console.error(message);
      }
    };

    // We need to run the effect on intial render/dep changes if the screen is focused
    if (navigation.isFocused()) {
      cleanup = callback();
      isFocused = true;
    }
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // If callback was already called for focus, avoid calling it again
      // The focus event may also fire on intial render, so we guard against runing the effect twice
      if (isFocused) {
        return;
      }
      if (cleanup !== undefined) {
        cleanup();
      }
      cleanup = callback();
      isFocused = true;
    });
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (cleanup !== undefined) {
        cleanup();
      }
      cleanup = undefined;
      isFocused = false;
    });
    return () => {
      if (cleanup !== undefined) {
        cleanup();
      }
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [effect, navigation]);
}
//# sourceMappingURL=useFocusEffect.js.map