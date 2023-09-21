var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useOptionsGetters;
var React = _interopRequireWildcard(require("react"));
var _NavigationBuilderContext = _interopRequireDefault(require("./NavigationBuilderContext"));
var _NavigationStateContext = _interopRequireDefault(require("./NavigationStateContext"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useOptionsGetters(_ref) {
  var key = _ref.key,
    options = _ref.options,
    navigation = _ref.navigation;
  var optionsRef = React.useRef(options);
  var optionsGettersFromChildRef = React.useRef({});
  var _React$useContext = React.useContext(_NavigationBuilderContext.default),
    onOptionsChange = _React$useContext.onOptionsChange;
  var _React$useContext2 = React.useContext(_NavigationStateContext.default),
    parentAddOptionsGetter = _React$useContext2.addOptionsGetter;
  var optionsChangeListener = React.useCallback(function () {
    var _navigation$isFocused;
    var isFocused = (_navigation$isFocused = navigation == null ? void 0 : navigation.isFocused()) != null ? _navigation$isFocused : true;
    var hasChildren = Object.keys(optionsGettersFromChildRef.current).length;
    if (isFocused && !hasChildren) {
      var _optionsRef$current;
      onOptionsChange((_optionsRef$current = optionsRef.current) != null ? _optionsRef$current : {});
    }
  }, [navigation, onOptionsChange]);
  React.useEffect(function () {
    optionsRef.current = options;
    optionsChangeListener();
    return navigation == null ? void 0 : navigation.addListener('focus', optionsChangeListener);
  }, [navigation, options, optionsChangeListener]);
  var getOptionsFromListener = React.useCallback(function () {
    for (var _key in optionsGettersFromChildRef.current) {
      if (optionsGettersFromChildRef.current.hasOwnProperty(_key)) {
        var _optionsGettersFromCh, _optionsGettersFromCh2;
        var result = (_optionsGettersFromCh = (_optionsGettersFromCh2 = optionsGettersFromChildRef.current)[_key]) == null ? void 0 : _optionsGettersFromCh.call(_optionsGettersFromCh2);
        if (result !== null) {
          return result;
        }
      }
    }
    return null;
  }, []);
  var getCurrentOptions = React.useCallback(function () {
    var _navigation$isFocused2;
    var isFocused = (_navigation$isFocused2 = navigation == null ? void 0 : navigation.isFocused()) != null ? _navigation$isFocused2 : true;
    if (!isFocused) {
      return null;
    }
    var optionsFromListener = getOptionsFromListener();
    if (optionsFromListener !== null) {
      return optionsFromListener;
    }
    return optionsRef.current;
  }, [navigation, getOptionsFromListener]);
  React.useEffect(function () {
    return parentAddOptionsGetter == null ? void 0 : parentAddOptionsGetter(key, getCurrentOptions);
  }, [getCurrentOptions, parentAddOptionsGetter, key]);
  var addOptionsGetter = React.useCallback(function (key, getter) {
    optionsGettersFromChildRef.current[key] = getter;
    optionsChangeListener();
    return function () {
      delete optionsGettersFromChildRef.current[key];
      optionsChangeListener();
    };
  }, [optionsChangeListener]);
  return {
    addOptionsGetter: addOptionsGetter,
    getCurrentOptions: getCurrentOptions
  };
}