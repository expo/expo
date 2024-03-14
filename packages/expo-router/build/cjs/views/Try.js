"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Try = void 0;
function _react() {
  const data = _interopRequireWildcard(require("react"));
  _react = function () {
    return data;
  };
  return data;
}
function _Splash() {
  const data = require("./Splash");
  _Splash = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/** Props passed to a page's `ErrorBoundary` export. */

// No way to access `getDerivedStateFromError` from a function component afaict.
class Try extends _react().Component {
  state = {
    error: undefined
  };
  static getDerivedStateFromError(error) {
    // Force hide the splash screen if an error occurs.
    _Splash().SplashScreen.hideAsync();
    return {
      error
    };
  }
  retry = () => {
    return new Promise(resolve => {
      this.setState({
        error: undefined
      }, () => {
        resolve();
      });
    });
  };
  render() {
    const {
      error
    } = this.state;
    const {
      catch: ErrorBoundary,
      children
    } = this.props;
    if (!error) {
      return children;
    }
    return /*#__PURE__*/_react().default.createElement(ErrorBoundary, {
      error: error,
      retry: this.retry
    });
  }
}
exports.Try = Try;
//# sourceMappingURL=Try.js.map