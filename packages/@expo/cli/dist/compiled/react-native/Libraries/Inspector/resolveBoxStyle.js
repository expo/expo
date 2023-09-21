'use strict';

var I18nManager = require('../ReactNative/I18nManager');
function resolveBoxStyle(prefix, style) {
  var hasParts = false;
  var result = {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0
  };
  var styleForAll = style[prefix];
  if (styleForAll != null) {
    for (var key of Object.keys(result)) {
      result[key] = styleForAll;
    }
    hasParts = true;
  }
  var styleForHorizontal = style[prefix + 'Horizontal'];
  if (styleForHorizontal != null) {
    result.left = styleForHorizontal;
    result.right = styleForHorizontal;
    hasParts = true;
  } else {
    var styleForLeft = style[prefix + 'Left'];
    if (styleForLeft != null) {
      result.left = styleForLeft;
      hasParts = true;
    }
    var styleForRight = style[prefix + 'Right'];
    if (styleForRight != null) {
      result.right = styleForRight;
      hasParts = true;
    }
    var styleForEnd = style[prefix + 'End'];
    if (styleForEnd != null) {
      var constants = I18nManager.getConstants();
      if (constants.isRTL && constants.doLeftAndRightSwapInRTL) {
        result.left = styleForEnd;
      } else {
        result.right = styleForEnd;
      }
      hasParts = true;
    }
    var styleForStart = style[prefix + 'Start'];
    if (styleForStart != null) {
      var _constants = I18nManager.getConstants();
      if (_constants.isRTL && _constants.doLeftAndRightSwapInRTL) {
        result.right = styleForStart;
      } else {
        result.left = styleForStart;
      }
      hasParts = true;
    }
  }
  var styleForVertical = style[prefix + 'Vertical'];
  if (styleForVertical != null) {
    result.bottom = styleForVertical;
    result.top = styleForVertical;
    hasParts = true;
  } else {
    var styleForBottom = style[prefix + 'Bottom'];
    if (styleForBottom != null) {
      result.bottom = styleForBottom;
      hasParts = true;
    }
    var styleForTop = style[prefix + 'Top'];
    if (styleForTop != null) {
      result.top = styleForTop;
      hasParts = true;
    }
  }
  return hasParts ? result : null;
}
module.exports = resolveBoxStyle;