var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeDialogManagerAndroid = _interopRequireDefault(require("../NativeModules/specs/NativeDialogManagerAndroid"));
function emptyCallback() {}
module.exports = {
  alertWithArgs: function alertWithArgs(args, callback) {
    if (!_NativeDialogManagerAndroid.default) {
      return;
    }
    _NativeDialogManagerAndroid.default.showAlert(args, emptyCallback, callback || emptyCallback);
  }
};