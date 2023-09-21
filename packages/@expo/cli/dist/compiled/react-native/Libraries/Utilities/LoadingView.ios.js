var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _processColor = _interopRequireDefault(require("../StyleSheet/processColor"));
var _Appearance = _interopRequireDefault(require("./Appearance"));
var _NativeDevLoadingView = _interopRequireDefault(require("./NativeDevLoadingView"));
module.exports = {
  showMessage: function showMessage(message, type) {
    if (_NativeDevLoadingView.default) {
      if (type === 'refresh') {
        var backgroundColor = (0, _processColor.default)('#2584e8');
        var textColor = (0, _processColor.default)('#ffffff');
        _NativeDevLoadingView.default.showMessage(message, typeof textColor === 'number' ? textColor : null, typeof backgroundColor === 'number' ? backgroundColor : null);
      } else if (type === 'load') {
        var _backgroundColor;
        var _textColor;
        if (_Appearance.default.getColorScheme() === 'dark') {
          _backgroundColor = (0, _processColor.default)('#fafafa');
          _textColor = (0, _processColor.default)('#242526');
        } else {
          _backgroundColor = (0, _processColor.default)('#404040');
          _textColor = (0, _processColor.default)('#ffffff');
        }
        _NativeDevLoadingView.default.showMessage(message, typeof _textColor === 'number' ? _textColor : null, typeof _backgroundColor === 'number' ? _backgroundColor : null);
      }
    }
  },
  hide: function hide() {
    _NativeDevLoadingView.default && _NativeDevLoadingView.default.hide();
  }
};