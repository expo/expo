Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ExceptionsManager = require("./ExceptionsManager");
var ReactFiberErrorDialog = {
  showErrorDialog: function showErrorDialog(_ref) {
    var componentStack = _ref.componentStack,
      errorValue = _ref.error;
    var error;
    if (errorValue instanceof Error) {
      error = errorValue;
    } else if (typeof errorValue === 'string') {
      error = new _ExceptionsManager.SyntheticError(errorValue);
    } else {
      error = new _ExceptionsManager.SyntheticError('Unspecified error');
    }
    try {
      error.componentStack = componentStack;
      error.isComponentError = true;
    } catch (_unused) {}
    (0, _ExceptionsManager.handleException)(error, false);
    return false;
  }
};
var _default = ReactFiberErrorDialog;
exports.default = _default;
//# sourceMappingURL=ReactFiberErrorDialog.js.map