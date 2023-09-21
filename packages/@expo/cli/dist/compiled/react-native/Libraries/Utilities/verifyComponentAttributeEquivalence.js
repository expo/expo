var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = verifyComponentAttributeEquivalence;
exports.getConfigWithoutViewProps = getConfigWithoutViewProps;
exports.stringifyViewConfig = stringifyViewConfig;
var _PlatformBaseViewConfig = _interopRequireDefault(require("../NativeComponent/PlatformBaseViewConfig"));
var IGNORED_KEYS = ['transform', 'hitSlop'];
function verifyComponentAttributeEquivalence(nativeViewConfig, staticViewConfig) {
  for (var prop of ['validAttributes', 'bubblingEventTypes', 'directEventTypes']) {
    var diff = Object.keys(lefthandObjectDiff(nativeViewConfig[prop], staticViewConfig[prop]));
    if (diff.length > 0) {
      var _staticViewConfig$uiV;
      var name = (_staticViewConfig$uiV = staticViewConfig.uiViewClassName) != null ? _staticViewConfig$uiV : nativeViewConfig.uiViewClassName;
      console.error(`'${name}' has a view config that does not match native. ` + `'${prop}' is missing: ${diff.join(', ')}`);
    }
  }
}
function lefthandObjectDiff(leftObj, rightObj) {
  var differentKeys = {};
  function compare(leftItem, rightItem, key) {
    if (typeof leftItem !== typeof rightItem && leftItem != null) {
      differentKeys[key] = rightItem;
      return;
    }
    if (typeof leftItem === 'object') {
      var objDiff = lefthandObjectDiff(leftItem, rightItem);
      if (Object.keys(objDiff).length > 1) {
        differentKeys[key] = objDiff;
      }
      return;
    }
    if (leftItem !== rightItem) {
      differentKeys[key] = rightItem;
      return;
    }
  }
  for (var key in leftObj) {
    if (IGNORED_KEYS.includes(key)) {
      continue;
    }
    if (!rightObj) {
      differentKeys[key] = {};
    } else if (leftObj.hasOwnProperty(key)) {
      compare(leftObj[key], rightObj[key], key);
    }
  }
  return differentKeys;
}
function getConfigWithoutViewProps(viewConfig, propName) {
  if (!viewConfig[propName]) {
    return {};
  }
  return Object.keys(viewConfig[propName]).filter(function (prop) {
    return !_PlatformBaseViewConfig.default[propName][prop];
  }).reduce(function (obj, prop) {
    obj[prop] = viewConfig[propName][prop];
    return obj;
  }, {});
}
function stringifyViewConfig(viewConfig) {
  return JSON.stringify(viewConfig, function (key, val) {
    if (typeof val === 'function') {
      return `ƒ ${val.name}`;
    }
    return val;
  }, 2);
}