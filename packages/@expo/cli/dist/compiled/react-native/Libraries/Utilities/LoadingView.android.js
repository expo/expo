var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _processColor = _interopRequireDefault(require("../StyleSheet/processColor"));
var _Appearance = _interopRequireDefault(require("./Appearance"));
var _NativeDevLoadingView = _interopRequireDefault(require("./NativeDevLoadingView"));
module.exports = {
  showMessage: function showMessage(message, type) {
    if (_NativeDevLoadingView.default) {
      var backgroundColor;
      var textColor;
      if (type === 'refresh') {
        backgroundColor = (0, _processColor.default)('#2584e8');
        textColor = (0, _processColor.default)('#ffffff');
      } else if (type === 'load') {
        if (_Appearance.default.getColorScheme() === 'dark') {
          backgroundColor = (0, _processColor.default)('#fafafa');
          textColor = (0, _processColor.default)('#242526');
        } else {
          backgroundColor = (0, _processColor.default)('#404040');
          textColor = (0, _processColor.default)('#ffffff');
        }
      }
      _NativeDevLoadingView.default.showMessage(message, typeof textColor === 'number' ? textColor : null, typeof backgroundColor === 'number' ? backgroundColor : null);
    }
  },
  hide: function hide() {
    _NativeDevLoadingView.default && _NativeDevLoadingView.default.hide();
  }
};