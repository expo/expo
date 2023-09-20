var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _AnimatedImplementation = _interopRequireDefault(require("./AnimatedImplementation"));
var _AnimatedMock = _interopRequireDefault(require("./AnimatedMock"));
var Animated = _Platform.default.isTesting ? _AnimatedMock.default : _AnimatedImplementation.default;
var _default = Object.assign({
  get FlatList() {
    return require("./components/AnimatedFlatList").default;
  },
  get Image() {
    return require("./components/AnimatedImage").default;
  },
  get ScrollView() {
    return require("./components/AnimatedScrollView").default;
  },
  get SectionList() {
    return require("./components/AnimatedSectionList").default;
  },
  get Text() {
    return require("./components/AnimatedText").default;
  },
  get View() {
    return require("./components/AnimatedView").default;
  }
}, Animated);
exports.default = _default;
//# sourceMappingURL=Animated.js.map