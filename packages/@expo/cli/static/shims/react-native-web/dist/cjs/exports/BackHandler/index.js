'use strict';
function emptyFunction() {}
(exports.__esModule = !0), (exports.default = void 0);
var BackHandler = {
    exitApp: emptyFunction,
    addEventListener: () => ({ remove: emptyFunction }),
    removeEventListener: emptyFunction,
  },
  _default = BackHandler;
(exports.default = _default), (module.exports = exports.default);
