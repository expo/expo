Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var rejectionTrackingOptions = {
  allRejections: true,
  onUnhandled: function onUnhandled(id) {
    var _message;
    var rejection = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var message;
    var stack;
    var stringValue = Object.prototype.toString.call(rejection);
    if (stringValue === '[object Error]') {
      message = Error.prototype.toString.call(rejection);
      var error = rejection;
      stack = error.stack;
    } else {
      try {
        message = require('pretty-format')(rejection);
      } catch (_unused) {
        message = typeof rejection === 'string' ? rejection : JSON.stringify(rejection);
      }
    }
    var warning = `Possible Unhandled Promise Rejection (id: ${id}):\n` + `${(_message = message) != null ? _message : ''}\n` + (stack == null ? '' : stack);
    console.warn(warning);
  },
  onHandled: function onHandled(id) {
    var warning = `Promise Rejection Handled (id: ${id})\n` + 'This means you can ignore any previous messages of the form ' + `"Possible Unhandled Promise Rejection (id: ${id}):"`;
    console.warn(warning);
  }
};
var _default = rejectionTrackingOptions;
exports.default = _default;