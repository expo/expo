'use strict';

var ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');
var resolveAssetSource = require('../Image/resolveAssetSource');
var processColor = require('../StyleSheet/processColor').default;
var processColorArray = require('../StyleSheet/processColorArray');
var insetsDiffer = require('../Utilities/differ/insetsDiffer');
var matricesDiffer = require('../Utilities/differ/matricesDiffer');
var pointsDiffer = require('../Utilities/differ/pointsDiffer');
var sizesDiffer = require('../Utilities/differ/sizesDiffer');
var UIManager = require('./UIManager');
var invariant = require('invariant');
function getNativeComponentAttributes(uiViewClassName) {
  var _bubblingEventTypes, _directEventTypes;
  var viewConfig = UIManager.getViewManagerConfig(uiViewClassName);
  invariant(viewConfig != null && viewConfig.NativeProps != null, 'requireNativeComponent: "%s" was not found in the UIManager.', uiViewClassName);
  var baseModuleName = viewConfig.baseModuleName,
    bubblingEventTypes = viewConfig.bubblingEventTypes,
    directEventTypes = viewConfig.directEventTypes;
  var nativeProps = viewConfig.NativeProps;
  bubblingEventTypes = (_bubblingEventTypes = bubblingEventTypes) != null ? _bubblingEventTypes : {};
  directEventTypes = (_directEventTypes = directEventTypes) != null ? _directEventTypes : {};
  while (baseModuleName) {
    var baseModule = UIManager.getViewManagerConfig(baseModuleName);
    if (!baseModule) {
      baseModuleName = null;
    } else {
      bubblingEventTypes = Object.assign({}, baseModule.bubblingEventTypes, bubblingEventTypes);
      directEventTypes = Object.assign({}, baseModule.directEventTypes, directEventTypes);
      nativeProps = Object.assign({}, baseModule.NativeProps, nativeProps);
      baseModuleName = baseModule.baseModuleName;
    }
  }
  var validAttributes = {};
  for (var key in nativeProps) {
    var typeName = nativeProps[key];
    var diff = getDifferForType(typeName);
    var process = getProcessorForType(typeName);
    validAttributes[key] = diff == null ? process == null ? true : {
      process: process
    } : process == null ? {
      diff: diff
    } : {
      diff: diff,
      process: process
    };
  }
  validAttributes.style = ReactNativeStyleAttributes;
  Object.assign(viewConfig, {
    uiViewClassName: uiViewClassName,
    validAttributes: validAttributes,
    bubblingEventTypes: bubblingEventTypes,
    directEventTypes: directEventTypes
  });
  attachDefaultEventTypes(viewConfig);
  return viewConfig;
}
function attachDefaultEventTypes(viewConfig) {
  var constants = UIManager.getConstants();
  if (constants.ViewManagerNames || constants.LazyViewManagersEnabled) {
    viewConfig = merge(viewConfig, UIManager.getDefaultEventTypes());
  } else {
    viewConfig.bubblingEventTypes = merge(viewConfig.bubblingEventTypes, constants.genericBubblingEventTypes);
    viewConfig.directEventTypes = merge(viewConfig.directEventTypes, constants.genericDirectEventTypes);
  }
}
function merge(destination, source) {
  if (!source) {
    return destination;
  }
  if (!destination) {
    return source;
  }
  for (var key in source) {
    if (!source.hasOwnProperty(key)) {
      continue;
    }
    var sourceValue = source[key];
    if (destination.hasOwnProperty(key)) {
      var destinationValue = destination[key];
      if (typeof sourceValue === 'object' && typeof destinationValue === 'object') {
        sourceValue = merge(destinationValue, sourceValue);
      }
    }
    destination[key] = sourceValue;
  }
  return destination;
}
function getDifferForType(typeName) {
  switch (typeName) {
    case 'CATransform3D':
      return matricesDiffer;
    case 'CGPoint':
      return pointsDiffer;
    case 'CGSize':
      return sizesDiffer;
    case 'UIEdgeInsets':
      return insetsDiffer;
    case 'Point':
      return pointsDiffer;
    case 'EdgeInsets':
      return insetsDiffer;
  }
  return null;
}
function getProcessorForType(typeName) {
  switch (typeName) {
    case 'CGColor':
    case 'UIColor':
      return processColor;
    case 'CGColorArray':
    case 'UIColorArray':
      return processColorArray;
    case 'CGImage':
    case 'UIImage':
    case 'RCTImageSource':
      return resolveAssetSource;
    case 'Color':
      return processColor;
    case 'ColorArray':
      return processColorArray;
    case 'ImageSource':
      return resolveAssetSource;
  }
  return null;
}
module.exports = getNativeComponentAttributes;