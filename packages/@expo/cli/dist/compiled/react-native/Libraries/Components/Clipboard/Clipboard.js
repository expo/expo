var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeClipboard = _interopRequireDefault(require("./NativeClipboard"));
module.exports = {
  getString: function getString() {
    return _NativeClipboard.default.getString();
  },
  setString: function setString(content) {
    _NativeClipboard.default.setString(content);
  }
};
//# sourceMappingURL=Clipboard.js.map