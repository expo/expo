'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printText = exports.printProps = exports.printElementAsLeaf = exports.printElement = exports.printComment = exports.printChildren = void 0;
var _escapeHTML = _interopRequireDefault(require('./escapeHTML'));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
var printProps = function printProps(keys, props, config, indentation, depth, refs, printer) {
  var indentationNext = indentation + config.indent;
  var colors = config.colors;
  return keys.map(function (key) {
    var value = props[key];
    var printed = printer(value, config, indentationNext, depth, refs);
    if (typeof value !== 'string') {
      if (printed.indexOf('\n') !== -1) {
        printed = config.spacingOuter + indentationNext + printed + config.spacingOuter + indentation;
      }
      printed = `{${printed}}`;
    }
    return `${config.spacingInner + indentation + colors.prop.open + key + colors.prop.close}=${colors.value.open}${printed}${colors.value.close}`;
  }).join('');
};
exports.printProps = printProps;
var printChildren = function printChildren(children, config, indentation, depth, refs, printer) {
  return children.map(function (child) {
    return config.spacingOuter + indentation + (typeof child === 'string' ? printText(child, config) : printer(child, config, indentation, depth, refs));
  }).join('');
};
exports.printChildren = printChildren;
var printText = function printText(text, config) {
  var contentColor = config.colors.content;
  return contentColor.open + (0, _escapeHTML.default)(text) + contentColor.close;
};
exports.printText = printText;
var printComment = function printComment(comment, config) {
  var commentColor = config.colors.comment;
  return `${commentColor.open}<!--${(0, _escapeHTML.default)(comment)}-->${commentColor.close}`;
};
exports.printComment = printComment;
var printElement = function printElement(type, printedProps, printedChildren, config, indentation) {
  var tagColor = config.colors.tag;
  return `${tagColor.open}<${type}${printedProps && tagColor.close + printedProps + config.spacingOuter + indentation + tagColor.open}${printedChildren ? `>${tagColor.close}${printedChildren}${config.spacingOuter}${indentation}${tagColor.open}</${type}` : `${printedProps && !config.min ? '' : ' '}/`}>${tagColor.close}`;
};
exports.printElement = printElement;
var printElementAsLeaf = function printElementAsLeaf(type, config) {
  var tagColor = config.colors.tag;
  return `${tagColor.open}<${type}${tagColor.close} …${tagColor.open} />${tagColor.close}`;
};
exports.printElementAsLeaf = printElementAsLeaf;