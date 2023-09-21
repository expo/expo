var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringifyValidationResult = stringifyValidationResult;
exports.validate = validate;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _ViewConfigIgnore = require("./ViewConfigIgnore");
function validate(name, nativeViewConfig, staticViewConfig) {
  var differences = [];
  accumulateDifferences(differences, [], {
    bubblingEventTypes: nativeViewConfig.bubblingEventTypes,
    directEventTypes: nativeViewConfig.directEventTypes,
    uiViewClassName: nativeViewConfig.uiViewClassName,
    validAttributes: nativeViewConfig.validAttributes
  }, {
    bubblingEventTypes: staticViewConfig.bubblingEventTypes,
    directEventTypes: staticViewConfig.directEventTypes,
    uiViewClassName: staticViewConfig.uiViewClassName,
    validAttributes: staticViewConfig.validAttributes
  });
  if (differences.length === 0) {
    return {
      type: 'valid'
    };
  }
  return {
    type: 'invalid',
    differences: differences
  };
}
function stringifyValidationResult(name, validationResult) {
  var differences = validationResult.differences;
  return [`StaticViewConfigValidator: Invalid static view config for '${name}'.`, ''].concat((0, _toConsumableArray2.default)(differences.map(function (difference) {
    var type = difference.type,
      path = difference.path;
    switch (type) {
      case 'missing':
        return `- '${path.join('.')}' is missing.`;
      case 'unequal':
        return `- '${path.join('.')}' is the wrong value.`;
      case 'unexpected':
        return `- '${path.join('.')}' is present but not expected to be.`;
    }
  })), ['']).join('\n');
}
function accumulateDifferences(differences, path, nativeObject, staticObject) {
  for (var nativeKey in nativeObject) {
    var nativeValue = nativeObject[nativeKey];
    if (!staticObject.hasOwnProperty(nativeKey)) {
      differences.push({
        path: [].concat((0, _toConsumableArray2.default)(path), [nativeKey]),
        type: 'missing',
        nativeValue: nativeValue
      });
      continue;
    }
    var staticValue = staticObject[nativeKey];
    var nativeValueIfObject = ifObject(nativeValue);
    if (nativeValueIfObject != null) {
      var staticValueIfObject = ifObject(staticValue);
      if (staticValueIfObject != null) {
        path.push(nativeKey);
        accumulateDifferences(differences, path, nativeValueIfObject, staticValueIfObject);
        path.pop();
        continue;
      }
    }
    if (nativeValue !== staticValue) {
      differences.push({
        path: [].concat((0, _toConsumableArray2.default)(path), [nativeKey]),
        type: 'unequal',
        nativeValue: nativeValue,
        staticValue: staticValue
      });
    }
  }
  for (var staticKey in staticObject) {
    if (!nativeObject.hasOwnProperty(staticKey) && !(0, _ViewConfigIgnore.isIgnored)(staticObject[staticKey])) {
      differences.push({
        path: [].concat((0, _toConsumableArray2.default)(path), [staticKey]),
        type: 'unexpected',
        staticValue: staticObject[staticKey]
      });
    }
  }
}
function ifObject(value) {
  return typeof value === 'object' && !Array.isArray(value) ? value : null;
}