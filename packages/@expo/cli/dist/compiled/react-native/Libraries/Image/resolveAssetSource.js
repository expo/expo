'use strict';

var AssetSourceResolver = require('./AssetSourceResolver');
var _require = require('./AssetUtils'),
  pickScale = _require.pickScale;
var AssetRegistry = require('@react-native/assets-registry/registry');
var _customSourceTransformer, _serverURL, _scriptURL;
var _sourceCodeScriptURL;
function getSourceCodeScriptURL() {
  if (_sourceCodeScriptURL) {
    return _sourceCodeScriptURL;
  }
  var sourceCode = global.nativeExtensions && global.nativeExtensions.SourceCode;
  if (!sourceCode) {
    sourceCode = require('../NativeModules/specs/NativeSourceCode').default;
  }
  _sourceCodeScriptURL = sourceCode.getConstants().scriptURL;
  return _sourceCodeScriptURL;
}
function getDevServerURL() {
  if (_serverURL === undefined) {
    var sourceCodeScriptURL = getSourceCodeScriptURL();
    var match = sourceCodeScriptURL && sourceCodeScriptURL.match(/^https?:\/\/.*?\//);
    if (match) {
      _serverURL = match[0];
    } else {
      _serverURL = null;
    }
  }
  return _serverURL;
}
function _coerceLocalScriptURL(scriptURL) {
  if (scriptURL) {
    if (scriptURL.startsWith('assets://')) {
      return null;
    }
    scriptURL = scriptURL.substring(0, scriptURL.lastIndexOf('/') + 1);
    if (!scriptURL.includes('://')) {
      scriptURL = 'file://' + scriptURL;
    }
  }
  return scriptURL;
}
function getScriptURL() {
  if (_scriptURL === undefined) {
    _scriptURL = _coerceLocalScriptURL(getSourceCodeScriptURL());
  }
  return _scriptURL;
}
function setCustomSourceTransformer(transformer) {
  _customSourceTransformer = transformer;
}
function resolveAssetSource(source) {
  if (typeof source === 'object') {
    return source;
  }
  var asset = AssetRegistry.getAssetByID(source);
  if (!asset) {
    return null;
  }
  var resolver = new AssetSourceResolver(getDevServerURL(), getScriptURL(), asset);
  if (_customSourceTransformer) {
    return _customSourceTransformer(resolver);
  }
  return resolver.defaultAsset();
}
resolveAssetSource.pickScale = pickScale;
resolveAssetSource.setCustomSourceTransformer = setCustomSourceTransformer;
module.exports = resolveAssetSource;
//# sourceMappingURL=resolveAssetSource.js.map