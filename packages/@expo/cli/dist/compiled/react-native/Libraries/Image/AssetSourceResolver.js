'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var PixelRatio = require('../Utilities/PixelRatio').default;
var Platform = require('../Utilities/Platform');
var _require = require('./AssetUtils'),
  pickScale = _require.pickScale;
var _require2 = require('@react-native/assets-registry/path-support'),
  getAndroidResourceFolderName = _require2.getAndroidResourceFolderName,
  getAndroidResourceIdentifier = _require2.getAndroidResourceIdentifier,
  getBasePath = _require2.getBasePath;
var invariant = require('invariant');
function getScaledAssetPath(asset) {
  var scale = pickScale(asset.scales, PixelRatio.get());
  var scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  var assetDir = getBasePath(asset);
  return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}
function getAssetPathInDrawableFolder(asset) {
  var scale = pickScale(asset.scales, PixelRatio.get());
  var drawableFolder = getAndroidResourceFolderName(asset, scale);
  var fileName = getAndroidResourceIdentifier(asset);
  return drawableFolder + '/' + fileName + '.' + asset.type;
}
var AssetSourceResolver = function () {
  function AssetSourceResolver(serverUrl, jsbundleUrl, asset) {
    (0, _classCallCheck2.default)(this, AssetSourceResolver);
    this.serverUrl = serverUrl;
    this.jsbundleUrl = jsbundleUrl;
    this.asset = asset;
  }
  (0, _createClass2.default)(AssetSourceResolver, [{
    key: "isLoadedFromServer",
    value: function isLoadedFromServer() {
      return !!this.serverUrl;
    }
  }, {
    key: "isLoadedFromFileSystem",
    value: function isLoadedFromFileSystem() {
      return !!(this.jsbundleUrl && this.jsbundleUrl.startsWith('file://'));
    }
  }, {
    key: "defaultAsset",
    value: function defaultAsset() {
      if (this.isLoadedFromServer()) {
        return this.assetServerURL();
      }
      if (Platform.OS === 'android') {
        return this.isLoadedFromFileSystem() ? this.drawableFolderInBundle() : this.resourceIdentifierWithoutScale();
      } else {
        return this.scaledAssetURLNearBundle();
      }
    }
  }, {
    key: "assetServerURL",
    value: function assetServerURL() {
      invariant(!!this.serverUrl, 'need server to load from');
      return this.fromSource(this.serverUrl + getScaledAssetPath(this.asset) + '?platform=' + Platform.OS + '&hash=' + this.asset.hash);
    }
  }, {
    key: "scaledAssetPath",
    value: function scaledAssetPath() {
      return this.fromSource(getScaledAssetPath(this.asset));
    }
  }, {
    key: "scaledAssetURLNearBundle",
    value: function scaledAssetURLNearBundle() {
      var path = this.jsbundleUrl || 'file://';
      return this.fromSource(path + getScaledAssetPath(this.asset).replace(/\.\.\//g, '_'));
    }
  }, {
    key: "resourceIdentifierWithoutScale",
    value: function resourceIdentifierWithoutScale() {
      invariant(Platform.OS === 'android', 'resource identifiers work on Android');
      return this.fromSource(getAndroidResourceIdentifier(this.asset));
    }
  }, {
    key: "drawableFolderInBundle",
    value: function drawableFolderInBundle() {
      var path = this.jsbundleUrl || 'file://';
      return this.fromSource(path + getAssetPathInDrawableFolder(this.asset));
    }
  }, {
    key: "fromSource",
    value: function fromSource(source) {
      return {
        __packager_asset: true,
        width: this.asset.width,
        height: this.asset.height,
        uri: source,
        scale: pickScale(this.asset.scales, PixelRatio.get())
      };
    }
  }]);
  return AssetSourceResolver;
}();
AssetSourceResolver.pickScale = pickScale;
module.exports = AssetSourceResolver;
//# sourceMappingURL=AssetSourceResolver.js.map