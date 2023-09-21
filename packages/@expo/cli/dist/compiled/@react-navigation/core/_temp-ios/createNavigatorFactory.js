var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createNavigatorFactory;
var _Group = _interopRequireDefault(require("./Group"));
var _Screen = _interopRequireDefault(require("./Screen"));
function createNavigatorFactory(Navigator) {
  return function () {
    if (arguments[0] !== undefined) {
      throw new Error("Creating a navigator doesn't take an argument. Maybe you are trying to use React Navigation 4 API? See https://reactnavigation.org/docs/hello-react-navigation for the latest API and guides.");
    }
    return {
      Navigator: Navigator,
      Group: _Group.default,
      Screen: _Screen.default
    };
  };
}