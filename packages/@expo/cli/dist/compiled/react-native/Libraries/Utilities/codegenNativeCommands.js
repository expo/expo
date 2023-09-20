Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _require = require('../ReactNative/RendererProxy'),
  dispatchCommand = _require.dispatchCommand;
function codegenNativeCommands(options) {
  var commandObj = {};
  options.supportedCommands.forEach(function (command) {
    commandObj[command] = function (ref) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      dispatchCommand(ref, command, args);
    };
  });
  return commandObj;
}
var _default = codegenNativeCommands;
exports.default = _default;
//# sourceMappingURL=codegenNativeCommands.js.map