var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeAlertManager = _interopRequireDefault(require("./NativeAlertManager"));
module.exports = {
  alertWithArgs: function alertWithArgs(args, callback) {
    if (_NativeAlertManager.default == null) {
      return;
    }
    _NativeAlertManager.default.alertWithArgs(args, callback);
  }
};