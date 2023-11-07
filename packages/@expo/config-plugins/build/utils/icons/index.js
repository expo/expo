"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IosIcons = exports.AssetContents = exports.AndroidManifestIcons = exports.AndroidIcons = void 0;
function _AssetContents() {
  const data = _interopRequireWildcard(require("./AssetContents"));
  _AssetContents = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "AssetContents", {
  enumerable: true,
  get: function () {
    return _AssetContents();
  }
});
function _AndroidIcons() {
  const data = _interopRequireWildcard(require("./withAndroidIcons"));
  _AndroidIcons = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "AndroidIcons", {
  enumerable: true,
  get: function () {
    return _AndroidIcons();
  }
});
function _AndroidManifestIcons() {
  const data = _interopRequireWildcard(require("./withAndroidManifestIcons"));
  _AndroidManifestIcons = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "AndroidManifestIcons", {
  enumerable: true,
  get: function () {
    return _AndroidManifestIcons();
  }
});
function _IosIcons() {
  const data = _interopRequireWildcard(require("./withIosIcons"));
  _IosIcons = function () {
    return data;
  };
  return data;
}
Object.defineProperty(exports, "IosIcons", {
  enumerable: true,
  get: function () {
    return _IosIcons();
  }
});
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
//# sourceMappingURL=index.js.map