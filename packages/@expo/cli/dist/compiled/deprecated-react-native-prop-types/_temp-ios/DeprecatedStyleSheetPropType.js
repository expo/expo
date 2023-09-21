'use strict';

var deprecatedCreateStrictShapeTypeChecker = require('./deprecatedCreateStrictShapeTypeChecker');
function DeprecatedStyleSheetPropType(shape) {
  var shapePropType = deprecatedCreateStrictShapeTypeChecker(shape);
  return function (props, propName, componentName, location) {
    var newProps = props;
    if (props[propName]) {
      newProps = {};
      newProps[propName] = flattenStyle(props[propName]);
    }
    for (var _len = arguments.length, rest = new Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
      rest[_key - 4] = arguments[_key];
    }
    return shapePropType.apply(void 0, [newProps, propName, componentName, location].concat(rest));
  };
}
function flattenStyle(style) {
  if (style === null || typeof style !== 'object') {
    return undefined;
  }
  if (!Array.isArray(style)) {
    return style;
  }
  var result = {};
  for (var i = 0, styleLength = style.length; i < styleLength; ++i) {
    var computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      for (var key in computedStyle) {
        result[key] = computedStyle[key];
      }
    }
  }
  return result;
}
module.exports = DeprecatedStyleSheetPropType;