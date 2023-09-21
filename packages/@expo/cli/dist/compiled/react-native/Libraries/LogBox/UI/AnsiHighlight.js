var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Ansi;
var _View = _interopRequireDefault(require("../../Components/View/View"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _anser = require("anser");
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var COLORS = {
  'ansi-black': 'rgb(27, 27, 27)',
  'ansi-red': 'rgb(187, 86, 83)',
  'ansi-green': 'rgb(144, 157, 98)',
  'ansi-yellow': 'rgb(234, 193, 121)',
  'ansi-blue': 'rgb(125, 169, 199)',
  'ansi-magenta': 'rgb(176, 101, 151)',
  'ansi-cyan': 'rgb(140, 220, 216)',
  'ansi-bright-black': 'rgb(98, 98, 98)',
  'ansi-bright-red': 'rgb(187, 86, 83)',
  'ansi-bright-green': 'rgb(144, 157, 98)',
  'ansi-bright-yellow': 'rgb(234, 193, 121)',
  'ansi-bright-blue': 'rgb(125, 169, 199)',
  'ansi-bright-magenta': 'rgb(176, 101, 151)',
  'ansi-bright-cyan': 'rgb(140, 220, 216)',
  'ansi-bright-white': 'rgb(247, 247, 247)'
};
function Ansi(_ref) {
  var text = _ref.text,
    style = _ref.style;
  var commonWhitespaceLength = Infinity;
  var parsedLines = text.split(/\n/).map(function (line) {
    return (0, _anser.ansiToJson)(line, {
      json: true,
      remove_empty: true,
      use_classes: true
    });
  });
  parsedLines.map(function (lines) {
    var _lines$, _lines$$content, _match$;
    var match = lines[2] && ((_lines$ = lines[2]) == null ? void 0 : (_lines$$content = _lines$.content) == null ? void 0 : _lines$$content.match(/^ +/));
    var whitespaceLength = match && ((_match$ = match[0]) == null ? void 0 : _match$.length) || 0;
    if (whitespaceLength < commonWhitespaceLength) {
      commonWhitespaceLength = whitespaceLength;
    }
  });
  var getText = function getText(content, key) {
    if (key === 1) {
      return content.replace(/\| $/, ' ');
    } else if (key === 2 && commonWhitespaceLength < Infinity) {
      return content.substr(commonWhitespaceLength);
    } else {
      return content;
    }
  };
  return (0, _jsxRuntime.jsx)(_View.default, {
    children: parsedLines.map(function (items, i) {
      return (0, _jsxRuntime.jsx)(_View.default, {
        style: styles.line,
        children: items.map(function (bundle, key) {
          var textStyle = bundle.fg && COLORS[bundle.fg] ? {
            backgroundColor: bundle.bg && COLORS[bundle.bg],
            color: bundle.fg && COLORS[bundle.fg]
          } : {
            backgroundColor: bundle.bg && COLORS[bundle.bg]
          };
          return (0, _jsxRuntime.jsx)(_Text.default, {
            style: [style, textStyle],
            children: getText(bundle.content, key)
          }, key);
        })
      }, i);
    })
  });
}
var styles = _StyleSheet.default.create({
  line: {
    flexDirection: 'row'
  }
});