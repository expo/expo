'use strict';

var ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');
var PixelRatio = require('../Utilities/PixelRatio').default;
var flatten = require('./flattenStyle');
var hairlineWidth = PixelRatio.roundToNearestPixel(0.4);
if (hairlineWidth === 0) {
  hairlineWidth = 1 / PixelRatio.get();
}
var absoluteFill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};
if (__DEV__) {
  Object.freeze(absoluteFill);
}
module.exports = {
  hairlineWidth: hairlineWidth,
  absoluteFill: absoluteFill,
  absoluteFillObject: absoluteFill,
  compose: function compose(style1, style2) {
    if (style1 != null && style2 != null) {
      return [style1, style2];
    } else {
      return style1 != null ? style1 : style2;
    }
  },
  flatten: flatten,
  setStyleAttributePreprocessor: function setStyleAttributePreprocessor(property, process) {
    var _ReactNativeStyleAttr, _ReactNativeStyleAttr2;
    var value;
    if (ReactNativeStyleAttributes[property] === true) {
      value = {
        process: process
      };
    } else if (typeof ReactNativeStyleAttributes[property] === 'object') {
      value = Object.assign({}, ReactNativeStyleAttributes[property], {
        process: process
      });
    } else {
      console.error(`${property} is not a valid style attribute`);
      return;
    }
    if (__DEV__ && typeof value.process === 'function' && typeof ((_ReactNativeStyleAttr = ReactNativeStyleAttributes[property]) == null ? void 0 : _ReactNativeStyleAttr.process) === 'function' && value.process !== ((_ReactNativeStyleAttr2 = ReactNativeStyleAttributes[property]) == null ? void 0 : _ReactNativeStyleAttr2.process)) {
      console.warn(`Overwriting ${property} style attribute preprocessor`);
    }
    ReactNativeStyleAttributes[property] = value;
  },
  create: function create(obj) {
    if (__DEV__) {
      for (var _key in obj) {
        if (obj[_key]) {
          Object.freeze(obj[_key]);
        }
      }
    }
    return obj;
  }
};
//# sourceMappingURL=StyleSheet.js.map