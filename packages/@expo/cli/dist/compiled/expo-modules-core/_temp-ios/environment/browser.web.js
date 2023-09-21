Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDOMAvailable = exports.isAsyncDebugging = exports.canUseViewport = exports.canUseEventListeners = void 0;
var _window$document;
var isDOMAvailable = typeof window !== 'undefined' && !!((_window$document = window.document) != null && _window$document.createElement);
exports.isDOMAvailable = isDOMAvailable;
var canUseEventListeners = isDOMAvailable && !!(window.addEventListener || window.attachEvent);
exports.canUseEventListeners = canUseEventListeners;
var canUseViewport = isDOMAvailable && !!window.screen;
exports.canUseViewport = canUseViewport;
var isAsyncDebugging = false;
exports.isAsyncDebugging = isAsyncDebugging;