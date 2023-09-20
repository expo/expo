var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Linking = _interopRequireDefault(require("../../Linking/Linking"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function getLinkRanges(string) {
  var regex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  var matches = [];
  var regexResult;
  while ((regexResult = regex.exec(string)) !== null) {
    if (regexResult != null) {
      matches.push({
        lowerBound: regexResult.index,
        upperBound: regex.lastIndex
      });
    }
  }
  return matches;
}
function TappableLinks(props) {
  var matches = getLinkRanges(props.content);
  if (matches.length === 0) {
    return (0, _jsxRuntime.jsx)(_Text.default, {
      style: props.style,
      children: props.content
    });
  }
  var fragments = [];
  var indexCounter = 0;
  var startIndex = 0;
  var _loop = function _loop() {
    if (startIndex < linkRange.lowerBound) {
      var _text = props.content.substring(startIndex, linkRange.lowerBound);
      fragments.push((0, _jsxRuntime.jsx)(_Text.default, {
        children: _text
      }, ++indexCounter));
    }
    var link = props.content.substring(linkRange.lowerBound, linkRange.upperBound);
    fragments.push((0, _jsxRuntime.jsx)(_Text.default, {
      onPress: function onPress() {
        _Linking.default.openURL(link);
      },
      style: styles.linkText,
      children: link
    }, ++indexCounter));
    startIndex = linkRange.upperBound;
  };
  for (var linkRange of matches) {
    _loop();
  }
  if (startIndex < props.content.length) {
    var text = props.content.substring(startIndex);
    fragments.push((0, _jsxRuntime.jsx)(_Text.default, {
      style: props.style,
      children: text
    }, ++indexCounter));
  }
  return (0, _jsxRuntime.jsx)(_Text.default, {
    style: props.style,
    children: fragments
  });
}
var cleanContent = function cleanContent(content) {
  return content.replace(/^(TransformError |Warning: (Warning: )?|Error: )/g, '');
};
function LogBoxMessage(props) {
  var _props$message = props.message,
    content = _props$message.content,
    substitutions = _props$message.substitutions;
  if (props.plaintext === true) {
    return (0, _jsxRuntime.jsx)(_Text.default, {
      children: cleanContent(content)
    });
  }
  var maxLength = props.maxLength != null ? props.maxLength : Infinity;
  var substitutionStyle = props.style;
  var elements = [];
  var length = 0;
  var createUnderLength = function createUnderLength(key, message, style) {
    var cleanMessage = cleanContent(message);
    if (props.maxLength != null) {
      cleanMessage = cleanMessage.slice(0, props.maxLength - length);
    }
    if (length < maxLength) {
      elements.push((0, _jsxRuntime.jsx)(TappableLinks, {
        content: cleanMessage,
        style: style
      }, key));
    }
    length += cleanMessage.length;
  };
  var lastOffset = substitutions.reduce(function (prevOffset, substitution, index) {
    var key = String(index);
    if (substitution.offset > prevOffset) {
      var prevPart = content.substr(prevOffset, substitution.offset - prevOffset);
      createUnderLength(key, prevPart);
    }
    var substitutionPart = content.substr(substitution.offset, substitution.length);
    createUnderLength(key + '.5', substitutionPart, substitutionStyle);
    return substitution.offset + substitution.length;
  }, 0);
  if (lastOffset < content.length) {
    var lastPart = content.substr(lastOffset);
    createUnderLength('-1', lastPart);
  }
  return (0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
    children: elements
  });
}
var styles = _StyleSheet.default.create({
  linkText: {
    textDecorationLine: 'underline'
  }
});
var _default = LogBoxMessage;
exports.default = _default;
//# sourceMappingURL=LogBoxMessage.js.map