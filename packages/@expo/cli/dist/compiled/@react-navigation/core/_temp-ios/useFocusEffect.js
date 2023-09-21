var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useFocusEffect;
var React = _interopRequireWildcard(require("react"));
var _useNavigation = _interopRequireDefault(require("./useNavigation"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useFocusEffect(effect) {
  var navigation = (0, _useNavigation.default)();
  if (arguments[1] !== undefined) {
    var message = "You passed a second argument to 'useFocusEffect', but it only accepts one argument. " + "If you want to pass a dependency array, you can use 'React.useCallback':\n\n" + 'useFocusEffect(\n' + '  React.useCallback(() => {\n' + '    // Your code here\n' + '  }, [depA, depB])\n' + ');\n\n' + 'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
    console.error(message);
  }
  React.useEffect(function () {
    var isFocused = false;
    var cleanup;
    var callback = function callback() {
      var destroy = effect();
      if (destroy === undefined || typeof destroy === 'function') {
        return destroy;
      }
      if (process.env.NODE_ENV !== 'production') {
        var _message = 'An effect function must not return anything besides a function, which is used for clean-up.';
        if (destroy === null) {
          _message += " You returned 'null'. If your effect does not require clean-up, return 'undefined' (or nothing).";
        } else if (typeof destroy.then === 'function') {
          _message += "\n\nIt looks like you wrote 'useFocusEffect(async () => ...)' or returned a Promise. " + 'Instead, write the async function inside your effect ' + 'and call it immediately:\n\n' + 'useFocusEffect(\n' + '  React.useCallback(() => {\n' + '    async function fetchData() {\n' + '      // You can await here\n' + '      const response = await MyAPI.getData(someId);\n' + '      // ...\n' + '    }\n\n' + '    fetchData();\n' + '  }, [someId])\n' + ');\n\n' + 'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
        } else {
          _message += ` You returned '${JSON.stringify(destroy)}'.`;
        }
        console.error(_message);
      }
    };
    if (navigation.isFocused()) {
      cleanup = callback();
      isFocused = true;
    }
    var unsubscribeFocus = navigation.addListener('focus', function () {
      if (isFocused) {
        return;
      }
      if (cleanup !== undefined) {
        cleanup();
      }
      cleanup = callback();
      isFocused = true;
    });
    var unsubscribeBlur = navigation.addListener('blur', function () {
      if (cleanup !== undefined) {
        cleanup();
      }
      cleanup = undefined;
      isFocused = false;
    });
    return function () {
      if (cleanup !== undefined) {
        cleanup();
      }
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [effect, navigation]);
}