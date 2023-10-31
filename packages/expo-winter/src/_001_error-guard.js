// node_modules/@react-native/js-polyfills/error-guard.js
(function (global2) {
  var _inGuard = 0;
  var _globalHandler = function onError(e, isFatal) {
    throw e;
  };
  var ErrorUtils2 = {
    setGlobalHandler: function setGlobalHandler(fun) {
      _globalHandler = fun;
    },
    getGlobalHandler: function getGlobalHandler() {
      return _globalHandler;
    },
    reportError: function reportError(error) {
      _globalHandler && _globalHandler(error, false);
    },
    reportFatalError: function reportFatalError(error) {
      _globalHandler && _globalHandler(error, true);
    },
    applyWithGuard: function applyWithGuard(fun, context, args, unused_onError, unused_name) {
      try {
        _inGuard++;
        return fun.apply(context, args);
      } catch (e) {
        ErrorUtils2.reportError(e);
      } finally {
        _inGuard--;
      }
      return null;
    },
    applyWithGuardIfNeeded: function applyWithGuardIfNeeded(fun, context, args) {
      if (ErrorUtils2.inGuard()) {
        return fun.apply(context, args);
      } else {
        ErrorUtils2.applyWithGuard(fun, context, args);
      }
      return null;
    },
    inGuard: function inGuard() {
      return !!_inGuard;
    },
    guard: function guard(fun, name, context) {
      var _ref2;
      if (typeof fun !== 'function') {
        console.warn('A function must be passed to ErrorUtils.guard, got ', fun);
        return null;
      }
      var guardName =
        (_ref2 = name != null ? name : fun.name) != null ? _ref2 : '<generated guard>';
      function guarded() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        return ErrorUtils2.applyWithGuard(
          fun,
          context != null ? context : this,
          args,
          null,
          guardName
        );
      }
      return guarded;
    },
  };
  global2.ErrorUtils = ErrorUtils2;
})(globalThis);
