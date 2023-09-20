var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _TouchableOpacity = _interopRequireDefault(require("../../Components/Touchable/TouchableOpacity"));
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _openURLInBrowser = _interopRequireDefault(require("../../Core/Devtools/openURLInBrowser"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _useColorScheme = _interopRequireDefault(require("../../Utilities/useColorScheme"));
var _Colors = _interopRequireDefault(require("./Colors"));
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var links = [{
  id: 1,
  title: 'The Basics',
  link: 'https://reactnative.dev/docs/tutorial',
  description: 'Explains a Hello World for React Native.'
}, {
  id: 2,
  title: 'Style',
  link: 'https://reactnative.dev/docs/style',
  description: 'Covers how to use the prop named style which controls the visuals.'
}, {
  id: 3,
  title: 'Layout',
  link: 'https://reactnative.dev/docs/flexbox',
  description: 'React Native uses flexbox for layout, learn how it works.'
}, {
  id: 4,
  title: 'Components',
  link: 'https://reactnative.dev/docs/components-and-apis',
  description: 'The full list of components and APIs inside React Native.'
}, {
  id: 5,
  title: 'Navigation',
  link: 'https://reactnative.dev/docs/navigation',
  description: 'How to handle moving between screens inside your application.'
}, {
  id: 6,
  title: 'Networking',
  link: 'https://reactnative.dev/docs/network',
  description: 'How to use the Fetch API in React Native.'
}, {
  id: 7,
  title: 'Help',
  link: 'https://reactnative.dev/help',
  description: 'Need more help? There are many other React Native developers who may have the answer.'
}, {
  id: 8,
  title: 'Follow us on Twitter',
  link: 'https://twitter.com/reactnative',
  description: 'Stay in touch with the community, join in on Q&As and more by following React Native on Twitter.'
}];
var LinkList = function LinkList() {
  var isDarkMode = (0, _useColorScheme.default)() === 'dark';
  return (0, _jsxRuntime.jsx)(_View.default, {
    style: styles.container,
    children: links.map(function (_ref) {
      var id = _ref.id,
        title = _ref.title,
        link = _ref.link,
        description = _ref.description;
      return (0, _jsxRuntime.jsxs)(_react.Fragment, {
        children: [(0, _jsxRuntime.jsx)(_View.default, {
          style: [styles.separator, {
            backgroundColor: isDarkMode ? _Colors.default.dark : _Colors.default.light
          }]
        }), (0, _jsxRuntime.jsxs)(_TouchableOpacity.default, {
          accessibilityRole: "button",
          onPress: function onPress() {
            return (0, _openURLInBrowser.default)(link);
          },
          style: styles.linkContainer,
          children: [(0, _jsxRuntime.jsx)(_Text.default, {
            style: styles.link,
            children: title
          }), (0, _jsxRuntime.jsx)(_Text.default, {
            style: [styles.description, {
              color: isDarkMode ? _Colors.default.lighter : _Colors.default.dark
            }],
            children: description
          })]
        })]
      }, id);
    })
  });
};
var styles = _StyleSheet.default.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 24
  },
  linkContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  link: {
    flex: 2,
    fontSize: 18,
    fontWeight: '400',
    color: _Colors.default.primary
  },
  description: {
    flex: 3,
    paddingVertical: 16,
    fontWeight: '400',
    fontSize: 18
  },
  separator: {
    height: _StyleSheet.default.hairlineWidth
  }
});
var _default = LinkList;
exports.default = _default;
//# sourceMappingURL=LearnMoreLinks.js.map